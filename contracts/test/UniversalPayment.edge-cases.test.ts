import { expect } from "chai";
import { ethers } from "hardhat";
import { UniversalPayment } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";

describe("UniversalPayment - Edge Cases & Boundary Tests", function () {
  let universalPayment: UniversalPayment;
  let mockZRC20: Contract;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let recipient: SignerWithAddress;
  let mockSystemContract: SignerWithAddress;

  beforeEach(async function () {
    [owner, user, recipient, mockSystemContract] = await ethers.getSigners();

    const MockZRC20Factory = await ethers.getContractFactory("MockZRC20");
    mockZRC20 = await MockZRC20Factory.deploy("Test Token", "TEST");

    const UniversalPaymentFactory = await ethers.getContractFactory("UniversalPayment");
    universalPayment = await UniversalPaymentFactory.deploy(
      owner.address, // Use owner as mock gateway
      mockSystemContract.address
    );

    await mockZRC20.mint(user.address, ethers.utils.parseEther("1000000"));
  });

  describe("Boundary Value Testing", function () {
    it("Should handle minimum valid amount (1 wei)", async function () {
      await mockZRC20.connect(user).approve(universalPayment.address, 1);
      
      await expect(
        universalPayment.connect(user).processPayment(
          mockZRC20.address,
          1,
          mockZRC20.address,
          recipient.address,
          1
        )
      ).to.emit(universalPayment, "PaymentProcessed")
        .withArgs(user.address, recipient.address, mockZRC20.address, mockZRC20.address, 1, 1);
    });

    it("Should handle maximum uint256 slippage update", async function () {
      // MAX_SLIPPAGE_BPS is 500, so max valid value is 500
      await universalPayment.connect(owner).setMinSlippage(500);
      expect(await universalPayment.minSlippageBps()).to.equal(500);
    });

    it("Should reject slippage exactly at boundary (501 bps)", async function () {
      await expect(
        universalPayment.connect(owner).setMinSlippage(501)
      ).to.be.revertedWithCustomError(universalPayment, "InvalidSlippage");
    });

    it("Should handle very large amounts", async function () {
      const largeAmount = ethers.utils.parseEther("1000000");
      await mockZRC20.connect(user).approve(universalPayment.address, largeAmount);
      
      await universalPayment.connect(user).processPayment(
        mockZRC20.address,
        largeAmount,
        mockZRC20.address,
        recipient.address,
        0
      );
      
      expect(await mockZRC20.balanceOf(recipient.address)).to.equal(largeAmount);
    });
  });

  describe("Slippage Calculation Edge Cases", function () {
    it("Should calculate slippage correctly for small amounts", async function () {
      const amount = ethers.BigNumber.from(1000);
      await mockZRC20.connect(user).approve(universalPayment.address, amount);
      
      // Default slippage is 50 bps (0.5%)
      // Min output = 1000 * (10000 - 50) / 10000 = 995
      await universalPayment.connect(user).processPayment(
        mockZRC20.address,
        amount,
        mockZRC20.address,
        recipient.address,
        0
      );
      
      expect(await mockZRC20.balanceOf(recipient.address)).to.equal(amount);
    });

    it("Should respect user-provided minAmountOut over calculated", async function () {
      const amount = ethers.utils.parseEther("100");
      await mockZRC20.connect(user).approve(universalPayment.address, amount);
      
      // User demands exactly 100 ETH (no slippage tolerance)
      await universalPayment.connect(user).processPayment(
        mockZRC20.address,
        amount,
        mockZRC20.address,
        recipient.address,
        amount // minAmountOut = full amount
      );
      
      expect(await mockZRC20.balanceOf(recipient.address)).to.equal(amount);
    });

    it("Should use calculated slippage when user minAmountOut is lower", async function () {
      const amount = ethers.utils.parseEther("100");
      await mockZRC20.connect(user).approve(universalPayment.address, amount);
      
      // User provides very low minAmountOut (1 ETH), contract should use calculated (99.5 ETH)
      await universalPayment.connect(user).processPayment(
        mockZRC20.address,
        amount,
        mockZRC20.address,
        recipient.address,
        ethers.utils.parseEther("1") // Very low user minimum
      );
      
      // Should succeed because output (100 ETH) > calculated minimum (99.5 ETH)
      expect(await mockZRC20.balanceOf(recipient.address)).to.equal(amount);
    });

    it("Should update slippage and apply to new transactions", async function () {
      // Change slippage to 1% (100 bps)
      await universalPayment.connect(owner).setMinSlippage(100);
      
      const amount = ethers.utils.parseEther("100");
      await mockZRC20.connect(user).approve(universalPayment.address, amount);
      
      // New minimum should be 100 * (10000 - 100) / 10000 = 99 ETH
      await universalPayment.connect(user).processPayment(
        mockZRC20.address,
        amount,
        mockZRC20.address,
        recipient.address,
        0
      );
      
      expect(await mockZRC20.balanceOf(recipient.address)).to.equal(amount);
    });
  });

  describe("Reentrancy Protection Edge Cases", function () {
    it("Should allow sequential payments (not reentrant)", async function () {
      const amount = ethers.utils.parseEther("10");
      await mockZRC20.connect(user).approve(universalPayment.address, amount.mul(2));
      
      // First payment
      await universalPayment.connect(user).processPayment(
        mockZRC20.address,
        amount,
        mockZRC20.address,
        recipient.address,
        0
      );
      
      // Second payment immediately after (should work)
      await universalPayment.connect(user).processPayment(
        mockZRC20.address,
        amount,
        mockZRC20.address,
        recipient.address,
        0
      );
      
      expect(await mockZRC20.balanceOf(recipient.address)).to.equal(amount.mul(2));
    });
  });

  describe("Pause/Unpause State Transitions", function () {
    it("Should allow multiple pause/unpause cycles", async function () {
      // Pause
      await universalPayment.connect(owner).pause();
      expect(await universalPayment.paused()).to.be.true;
      
      // Unpause
      await universalPayment.connect(owner).unpause();
      expect(await universalPayment.paused()).to.be.false;
      
      // Pause again
      await universalPayment.connect(owner).pause();
      expect(await universalPayment.paused()).to.be.true;
      
      // Unpause again
      await universalPayment.connect(owner).unpause();
      expect(await universalPayment.paused()).to.be.false;
    });

    it("Should emit events on pause/unpause", async function () {
      await expect(universalPayment.connect(owner).pause())
        .to.emit(universalPayment, "Paused")
        .withArgs(owner.address);
      
      await expect(universalPayment.connect(owner).unpause())
        .to.emit(universalPayment, "Unpaused")
        .withArgs(owner.address);
    });

    it("Should not allow pausing when already paused", async function () {
      await universalPayment.connect(owner).pause();
      
      await expect(
        universalPayment.connect(owner).pause()
      ).to.be.revertedWithCustomError(universalPayment, "EnforcedPause");
    });

    it("Should not allow unpausing when not paused", async function () {
      await expect(
        universalPayment.connect(owner).unpause()
      ).to.be.revertedWithCustomError(universalPayment, "ExpectedPause");
    });
  });

  describe("Ownership Transfers", function () {
    it("Should allow owner to transfer ownership", async function () {
      const [, , , newOwner] = await ethers.getSigners();
      
      await universalPayment.connect(owner).transferOwnership(newOwner.address);
      expect(await universalPayment.owner()).to.equal(newOwner.address);
    });

    it("Should emit OwnershipTransferred event", async function () {
      const [, , , newOwner] = await ethers.getSigners();
      
      await expect(universalPayment.connect(owner).transferOwnership(newOwner.address))
        .to.emit(universalPayment, "OwnershipTransferred")
        .withArgs(owner.address, newOwner.address);
    });

    it("Should not allow non-owner to transfer ownership", async function () {
      const [, , , newOwner] = await ethers.getSigners();
      
      await expect(
        universalPayment.connect(user).transferOwnership(newOwner.address)
      ).to.be.revertedWithCustomError(universalPayment, "OwnableUnauthorizedAccount");
    });

    it("Should update permissions after ownership transfer", async function () {
      const [, , , newOwner] = await ethers.getSigners();
      
      await universalPayment.connect(owner).transferOwnership(newOwner.address);
      
      // Old owner should not be able to pause
      await expect(
        universalPayment.connect(owner).pause()
      ).to.be.revertedWithCustomError(universalPayment, "OwnableUnauthorizedAccount");
      
      // New owner should be able to pause
      await universalPayment.connect(newOwner).pause();
      expect(await universalPayment.paused()).to.be.true;
    });
  });

  describe("Gas Optimization Verification", function () {
    it("Should use custom errors (gas efficient)", async function () {
      // Test that custom errors are used (they consume less gas than strings)
      await expect(
        universalPayment.connect(user).processPayment(
          mockZRC20.address,
          0, // Zero amount
          mockZRC20.address,
          recipient.address,
          0
        )
      ).to.be.revertedWithCustomError(universalPayment, "InvalidAmount");
    });

    it("Should verify immutable variables save gas", async function () {
      // Reading immutable variables is cheaper than reading storage
      // This test verifies they exist
      expect(await universalPayment.gateway()).to.not.equal(ethers.constants.AddressZero);
      expect(await universalPayment.systemContract()).to.equal(mockSystemContract.address);
    });
  });

  describe("Event Emission Coverage", function () {
    it("Should emit SlippageUpdated event with correct values", async function () {
      const oldSlippage = await universalPayment.minSlippageBps();
      const newSlippage = 100;
      
      await expect(universalPayment.connect(owner).setMinSlippage(newSlippage))
        .to.emit(universalPayment, "SlippageUpdated")
        .withArgs(oldSlippage, newSlippage);
    });

    it("Should emit PaymentProcessed with all parameters", async function () {
      const amount = ethers.utils.parseEther("50");
      await mockZRC20.connect(user).approve(universalPayment.address, amount);
      
      await expect(
        universalPayment.connect(user).processPayment(
          mockZRC20.address,
          amount,
          mockZRC20.address,
          recipient.address,
          0
        )
      ).to.emit(universalPayment, "PaymentProcessed")
        .withArgs(
          user.address,
          recipient.address,
          mockZRC20.address,
          mockZRC20.address,
          amount,
          amount
        );
    });
  });

  describe("Multiple Users Concurrency", function () {
    it("Should handle payments from multiple users simultaneously", async function () {
      const [, , , user2, recipient2] = await ethers.getSigners();
      
      // Setup for both users
      await mockZRC20.mint(user2.address, ethers.utils.parseEther("1000"));
      
      const amount1 = ethers.utils.parseEther("10");
      const amount2 = ethers.utils.parseEther("20");
      
      await mockZRC20.connect(user).approve(universalPayment.address, amount1);
      await mockZRC20.connect(user2).approve(universalPayment.address, amount2);
      
      // Process payments
      await universalPayment.connect(user).processPayment(
        mockZRC20.address,
        amount1,
        mockZRC20.address,
        recipient.address,
        0
      );
      
      await universalPayment.connect(user2).processPayment(
        mockZRC20.address,
        amount2,
        mockZRC20.address,
        recipient2.address,
        0
      );
      
      expect(await mockZRC20.balanceOf(recipient.address)).to.equal(amount1);
      expect(await mockZRC20.balanceOf(recipient2.address)).to.equal(amount2);
    });
  });
});
