import { ethers } from "ethers";
import { readConfig } from "./configManager.js";

const RPC_URL = process.env.RPC_URL!;
const KEEPER_PRIVATE_KEY = process.env.KEEPER_PRIVATE_KEY!;
const ROLES_MODIFIER_ADDRESS = process.env.ROLES_MODIFIER_ADDRESS!;
const GNOSIS_PAY_ADDRESS = process.env.GNOSIS_PAY_ADDRESS!;

if (!RPC_URL || !KEEPER_PRIVATE_KEY || !ROLES_MODIFIER_ADDRESS || !GNOSIS_PAY_ADDRESS) {
  throw new Error("Missing required environment variables.");
}

const ROLE_KEY = ethers.encodeBytes32String("auto_topup");

const EURE_ADDRESS = "0xcB444e90D8198415266c6a2724b7900fb12FC56E"; // EURe v2
const AAVE_POOL_ADDRESS = "0xb50201558b00496a145fe76f7424749556e326d8"; // Gnosis Aave V3 Pool

const erc20Abi = ["function balanceOf(address account) view returns (uint256)"];
const aavePoolAbi = [
  "function withdraw(address asset, uint256 amount, address to) external returns (uint256)",
];
const rolesAbi = [
  "function execTransactionWithRole(address to, uint256 value, bytes data, uint8 operation, bytes32 role, bool shouldRevert) external returns (bool success)",
];

export async function checkAndTopUp(): Promise<void> {
  try {
    const config = await readConfig();
    const minBalanceWei = ethers.parseUnits(config.minBalance.toString(), 18);
    const topUpAmountWei = ethers.parseUnits(config.topupAmount.toString(), 18);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const keeperWallet = new ethers.Wallet(KEEPER_PRIVATE_KEY, provider);

    const eureContract = new ethers.Contract(EURE_ADDRESS, erc20Abi, provider) as any;
    const rolesContract = new ethers.Contract(
      ROLES_MODIFIER_ADDRESS,
      rolesAbi,
      keeperWallet,
    ) as any;

    const currentBalance: bigint = await eureContract.balanceOf(GNOSIS_PAY_ADDRESS);
    console.log(`Current Gnosis Pay Balance: ${ethers.formatUnits(currentBalance, 18)} EURe`);

    if (currentBalance < minBalanceWei) {
      console.log("Balance below threshold. Initiating top-up from Aave...");

      const aaveInterface = new ethers.Interface(aavePoolAbi);
      const withdrawData = aaveInterface.encodeFunctionData("withdraw", [
        EURE_ADDRESS,
        topUpAmountWei,
        GNOSIS_PAY_ADDRESS,
      ]);

      console.log("Submitting transaction through Zodiac Roles Modifier...");
      const tx = await rolesContract.execTransactionWithRole(
        AAVE_POOL_ADDRESS,
        0,
        withdrawData,
        0,
        ROLE_KEY,
        true,
      );

      console.log(`Transaction submitted! Hash: ${tx.hash}`);
      await tx.wait();
      console.log("Top-up successful.");
    }
  } catch (error) {
    console.error("Error during top-up check:", error);
  }
}
