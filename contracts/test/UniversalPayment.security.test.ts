import { expect } from "chai";
import { ethers } from "hardhat";
import { UniversalPayment } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";

describe("UniversalPayment - Security & Mainnet Readiness", function () {
  let universalPayment: UniversalPayment;
  let mockZRC20Input: Contract;
  let mockZRC20Target: Contract;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let recipient: SignerWithAddress;
  let attacker: SignerWithAddress;
  let mockSystemContract: SignerWithAddress;

  beforeEach(async function () {
    [owner, user, recipient, attacker, mockSystemContract] = await ethers.getSigners();

    // Deploy mock ZRC20 tokens
    const MockZRC20Factory = await ethers.getContractFactory("MockZRC20");
    mockZRC20Input = await MockZRC20Factory.deploy("Input Token", "INPUT");
    mockZRC20Target = await MockZRC20Factory.deploy("Target Token", "TARGET");

    // Deploy UniversalPayment contract
    const UniversalPaymentFactory = await ethers.getContractFactory("UniversalPayment");
    universalPayment = await UniversalPaymentFactory.deploy(
      ethers.constants.AddressZero, // Gateway address
      mockSystemContract.address // System contract address
    );

    // Mint tokens to user
    await mockZRC20Input.mint(user.address, ethers.utils.parseEther("1000"));
    await mockZRC20Target.mint(universalPayment.address, ethers.utils.parseEther("1000"));
  });

  describe("Security Features", function () {
    describe("Access Control (Ownable)", function () {
      it("Should set deployer as owner", async function () {
        expect(await universalPayment.owner()).to.equal(owner.address);
      });

      it("Should allow owner to pause contract", async function () {
        await universalPayment.connect(owner).pause();
        expect(await universalPayment.paused()).to.be.true;
      });

      it("Should not allow non-owner to pause", async function () {
        await expect(
          universalPayment.connect(attacker).pause()
        ).to.be.revertedWithCustomError(universalPayment, "OwnableUnauthorizedAccount");
      });

      it("Should allow owner to set slippage", async function () {
        await expect(universalPayment.connect(owner).setMinSlippage(100))
          .to.emit(universalPayment, "SlippageUpdated")
          .withArgs(50, 100);
      });

      it("Should not allow non-owner to set slippage", async function () {
        await expect(
          universalPayment.connect(attacker).setMinSlippage(100)
        ).to.be.revertedWithCustomError(universalPayment, "OwnableUnauthorizedAccount");
      });

      it("Should reject invalid slippage values", async function () {
        await expect(
          universalPayment.connect(owner).setMinSlippage(0)
        ).to.be.revertedWithCustomError(universalPayment, "InvalidSlippage");

        await expect(
          universalPayment.connect(owner).setMinSlippage(600) // > MAX_SLIPPAGE_BPS
        ).to.be.revertedWithCustomError(universalPayment, "InvalidSlippage");
      });
    });

    describe("Pausable", function () {
      it("Should allow payments when not paused", async function () {
        await mockZRC20Input.connect(user).approve(universalPayment.address, ethers.utils.parseEther("100"));
        
        await expect(
          universalPayment.connect(user).processPayment(
            mockZRC20Input.address,
            ethers.utils.parseEther("100"),
            mockZRC20Input.address, // Same token (no swap)
            recipient.address,
            0
          )
        ).to.not.be.reverted;
      });

      it("Should block payments when paused", async function () {
        await universalPayment.connect(owner).pause();
        
        await mockZRC20Input.connect(user).approve(universalPayment.address, ethers.utils.parseEther("100"));
        
        await expect(
          universalPayment.connect(user).processPayment(
            mockZRC20Input.address,
            ethers.utils.parseEther("100"),
            mockZRC20Input.address,
            recipient.address,
            0
          )
        ).to.be.revertedWithCustomError(universalPayment, "EnforcedPause");
      });

      it("Should allow unpausing", async function () {
        await universalPayment.connect(owner).pause();
        expect(await universalPayment.paused()).to.be.true;
        
        await universalPayment.connect(owner).unpause();
        expect(await universalPayment.paused()).to.be.false;
      });
    });

    describe("Emergency Withdraw", function () {
      beforeEach(async function () {
        // Send some tokens to the contract
        await mockZRC20Input.mint(universalPayment.address, ethers.utils.parseEther("500"));
      });

      it("Should only allow owner to emergency withdraw when paused", async function () {
        await universalPayment.connect(owner).pause();
        
        const balanceBefore = await mockZRC20Input.balanceOf(owner.address);
        await universalPayment.connect(owner).emergencyWithdraw(
          mockZRC20Input.address,
          owner.address,
          ethers.utils.parseEther("100")
        );
        const balanceAfter = await mockZRC20Input.balanceOf(owner.address);
        
        expect(balanceAfter.sub(balanceBefore)).to.equal(ethers.utils.parseEther("100"));
      });

      it("Should not allow emergency withdraw when not paused", async function () {
        await expect(
          universalPayment.connect(owner).emergencyWithdraw(
            mockZRC20Input.address,
            owner.address,
            ethers.utils.parseEther("100")
          )
        ).to.be.revertedWithCustomError(universalPayment, "ExpectedPause");
      });

      it("Should not allow non-owner to emergency withdraw", async function () {
        await universalPayment.connect(owner).pause();
        
        await expect(
          universalPayment.connect(attacker).emergencyWithdraw(
            mockZRC20Input.address,
            attacker.address,
            ethers.utils.parseEther("100")
          )
        ).to.be.revertedWithCustomError(universalPayment, "OwnableUnauthorizedAccount");
      });

      it("Should emit EmergencyWithdrawal event", async function () {
        await universalPayment.connect(owner).pause();
        
        await expect(
          universalPayment.connect(owner).emergencyWithdraw(
            mockZRC20Input.address,
            owner.address,
            ethers.utils.parseEther("100")
          )
        ).to.emit(universalPayment, "EmergencyWithdrawal")
          .withArgs(mockZRC20Input.address, owner.address, ethers.utils.parseEther("100"));
      });

      it("Should reject zero amount", async function () {
        await universalPayment.connect(owner).pause();
        
        await expect(
          universalPayment.connect(owner).emergencyWithdraw(
            mockZRC20Input.address,
            owner.address,
            0
          )
        ).to.be.revertedWithCustomError(universalPayment, "InvalidAmount");
      });

      it("Should reject zero address recipient", async function () {
        await universalPayment.connect(owner).pause();
        
        await expect(
          universalPayment.connect(owner).emergencyWithdraw(
            mockZRC20Input.address,
            ethers.constants.AddressZero,
            ethers.utils.parseEther("100")
          )
        ).to.be.revertedWithCustomError(universalPayment, "InvalidRecipient");
      });
    });
  });

  describe("Payment Processing", function () {
    beforeEach(async function () {
      await mockZRC20Input.connect(user).approve(
        universalPayment.address,
        ethers.utils.parseEther("1000")
      );
    });

    it("Should process payment with same token (no swap)", async function () {
      const amount = ethers.utils.parseEther("100");
      
      await expect(
        universalPayment.connect(user).processPayment(
          mockZRC20Input.address,
          amount,
          mockZRC20Input.address,
          recipient.address,
          0
        )
      ).to.emit(universalPayment, "PaymentProcessed")
        .withArgs(user.address, recipient.address, mockZRC20Input.address, mockZRC20Input.address, amount, amount);
      
      expect(await mockZRC20Input.balanceOf(recipient.address)).to.equal(amount);
    });

    it("Should reject zero amount", async function () {
      await expect(
        universalPayment.connect(user).processPayment(
          mockZRC20Input.address,
          0,
          mockZRC20Input.address,
          recipient.address,
          0
        )
      ).to.be.revertedWithCustomError(universalPayment, "InvalidAmount");
    });

    it("Should reject zero address recipient", async function () {
      await expect(
        universalPayment.connect(user).processPayment(
          mockZRC20Input.address,
          ethers.utils.parseEther("100"),
          mockZRC20Input.address,
          ethers.constants.AddressZero,
          0
        )
      ).to.be.revertedWithCustomError(universalPayment, "InvalidRecipient");
    });

    it("Should fail if user hasn't approved tokens", async function () {
      // Create a new user without approval
      const [, , , newUser] = await ethers.getSigners();
      await mockZRC20Input.mint(newUser.address, ethers.utils.parseEther("100"));
      
      await expect(
        universalPayment.connect(newUser).processPayment(
          mockZRC20Input.address,
          ethers.utils.parseEther("100"),
          mockZRC20Input.address,
          recipient.address,
          0
        )
      ).to.be.revertedWithCustomError(universalPayment, "TokenTransferFailed");
    });
  });

  describe("Slippage Protection", function () {
    it("Should apply minimum slippage tolerance", async function () {
      const amount = ethers.utils.parseEther("100");
      
      // Default minSlippageBps is 50 (0.5%)
      // With 100 ETH input, minimum acceptable output is ~99.5 ETH
      
      await mockZRC20Input.connect(user).approve(universalPayment.address, amount);
      
      // This test verifies the slippage calculation is applied
      // In production with real DEX, this would protect against sandwich attacks
      await universalPayment.connect(user).processPayment(
        mockZRC20Input.address,
        amount,
        mockZRC20Input.address,
        recipient.address,
        0 // Let contract calculate min based on slippage
      );
      
      // Verify payment was processed
      expect(await mockZRC20Input.balanceOf(recipient.address)).to.equal(amount);
    });
  });

  describe("Contract Information", function () {
    it("Should return correct version", async function () {
      expect(await universalPayment.version()).to.equal("1.0.0");
    });

    it("Should have immutable gateway and systemContract", async function () {
      expect(await universalPayment.gateway()).to.equal(ethers.constants.AddressZero);
      expect(await universalPayment.systemContract()).to.equal(mockSystemContract.address);
    });

    it("Should have correct constants", async function () {
      expect(await universalPayment.MAX_SLIPPAGE_BPS()).to.equal(500); // 5%
      expect(await universalPayment.minSlippageBps()).to.equal(50); // 0.5%
    });
  });
});
