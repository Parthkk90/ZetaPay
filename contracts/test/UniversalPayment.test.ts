import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { UniversalPayment, MockZRC20, MockUniswapV2Router } from "../typechain-types";

describe("UniversalPayment", function () {
  let universalPayment: UniversalPayment;
  let mockZRC20_A: MockZRC20;
  let mockZRC20_B: MockZRC20;
  let mockRouter: MockUniswapV2Router;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let recipient: SignerWithAddress;

  beforeEach(async function () {
    [owner, user, recipient] = await ethers.getSigners();

    const MockZRC20Factory = await ethers.getContractFactory("MockZRC20");
    mockZRC20_A = await MockZRC20Factory.deploy("Mock Token A", "MTA");
    mockZRC20_B = await MockZRC20Factory.deploy("Mock Token B", "MTB");

    const MockRouterFactory = await ethers.getContractFactory("MockUniswapV2Router");
    mockRouter = await MockRouterFactory.deploy();

    const UniversalPaymentFactory = await ethers.getContractFactory("UniversalPayment");
    universalPayment = await UniversalPaymentFactory.deploy(ethers.constants.AddressZero);

    await mockZRC20_A.mint(user.address, ethers.utils.parseEther("100"));
  });

  it("Should swap tokens and transfer to the recipient", async function () {
    const amount = ethers.utils.parseEther("10");
    const message = ethers.utils.defaultAbiCoder.encode(
      ["address", "address"],
      [mockZRC20_B.address, recipient.address]
    );

    await mockZRC20_A.connect(user).approve(universalPayment.address, amount);

    // Simulate the swap in the mock router
    await mockZRC20_B.mint(universalPayment.address, ethers.utils.parseEther("20"));

    await universalPayment.connect(user).onCall(
      ethers.utils.toUtf8Bytes("origin"),
      1, // originChainId
      user.address, // destinationAddress
      7001, // destinationChainId
      amount,
      message
    );

    expect(await mockZRC20_B.balanceOf(recipient.address)).to.equal(ethers.utils.parseEther("20"));
  });
});
