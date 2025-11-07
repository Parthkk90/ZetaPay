import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { UniversalPayment } from "../typechain-types";
import { Contract } from "ethers";

describe("UniversalPayment - Basic Functionality", function () {
  let universalPayment: UniversalPayment;
  let mockZRC20_A: Contract;
  let mockZRC20_B: Contract;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let recipient: SignerWithAddress;
  let mockSystemContract: SignerWithAddress;

  beforeEach(async function () {
    [owner, user, recipient, mockSystemContract] = await ethers.getSigners();

    const MockZRC20Factory = await ethers.getContractFactory("MockZRC20");
    mockZRC20_A = await MockZRC20Factory.deploy("Mock Token A", "MTA");
    mockZRC20_B = await MockZRC20Factory.deploy("Mock Token B", "MTB");

    const UniversalPaymentFactory = await ethers.getContractFactory("UniversalPayment");
    universalPayment = await UniversalPaymentFactory.deploy(
      owner.address, // Gateway address
      mockSystemContract.address // System contract address
    );

    await mockZRC20_A.mint(user.address, ethers.utils.parseEther("100"));
  });

  it("Should transfer tokens to recipient (same token, no swap)", async function () {
    const amount = ethers.utils.parseEther("10");

    await mockZRC20_A.connect(user).approve(universalPayment.address, amount);

    await universalPayment.connect(user).processPayment(
      mockZRC20_A.address,
      amount,
      mockZRC20_A.address, // Same token (no swap)
      recipient.address,
      0 // No minimum
    );

    expect(await mockZRC20_A.balanceOf(recipient.address)).to.equal(amount);
  });
  
  it("Should deduct tokens from sender", async function () {
    const amount = ethers.utils.parseEther("10");
    const initialBalance = await mockZRC20_A.balanceOf(user.address);

    await mockZRC20_A.connect(user).approve(universalPayment.address, amount);

    await universalPayment.connect(user).processPayment(
      mockZRC20_A.address,
      amount,
      mockZRC20_A.address,
      recipient.address,
      0
    );

    expect(await mockZRC20_A.balanceOf(user.address)).to.equal(initialBalance.sub(amount));
  });
  
  it("Should emit PaymentProcessed event", async function () {
    const amount = ethers.utils.parseEther("10");

    await mockZRC20_A.connect(user).approve(universalPayment.address, amount);

    await expect(
      universalPayment.connect(user).processPayment(
        mockZRC20_A.address,
        amount,
        mockZRC20_A.address,
        recipient.address,
        0
      )
    ).to.emit(universalPayment, "PaymentProcessed")
      .withArgs(
        user.address,
        recipient.address,
        mockZRC20_A.address,
        mockZRC20_A.address,
        amount,
        amount
      );
  });
});
