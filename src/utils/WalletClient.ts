import WalletConnect, { CLIENT_EVENTS } from "@walletconnect/client";
import { ethers } from "ethers";
import WalletConnectClient from "@walletconnect/client";
import { SessionTypes } from "@walletconnect/types";

export interface WalletClientOptions {
  privateKey: string;
  chainId: number;
  rpcURL: string;
  relayProvider: string;
}

export class WalletClient {
  readonly provider: ethers.providers.JsonRpcProvider;
  readonly signer: ethers.Wallet;
  readonly chainId: number;
  readonly walletConnectClient: Promise<WalletConnect>;
  readonly listener?: Promise<void>;

  constructor(options: Partial<WalletClientOptions> = {}) {
    const wallet = options.privateKey
      ? new ethers.Wallet(options.privateKey)
      : ethers.Wallet.createRandom();
    this.chainId = options.chainId ? options.chainId : 123;
    const rpcURL = options.rpcURL ? options.rpcURL : "http://localhost:8545";
    this.provider = new ethers.providers.JsonRpcProvider(rpcURL);
    this.signer = wallet.connect(this.provider);
    this.walletConnectClient = WalletConnectClient.init({
      relayProvider: options.relayProvider
        ? options.relayProvider
        : "ws://0.0.0.0:5555",
      controller: true,
      // storageOptions: {
      //   database: "WalletClientDatabase.db",
      //   tableName: "test1",
      // },
      logger: "warn",
    });
    this.listener = this.listen();
  }

  async pair(uri: string): Promise<void> {
    const wc = await this.walletConnectClient;
    console.log("Start pair");
    const res = await wc.pair({ uri });
  }

  private async listen(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const wc = await this.walletConnectClient;
      console.log("Mobile listening");
      wc.on(
        CLIENT_EVENTS.session.proposal,
        async (proposal: SessionTypes.Proposal) => {
          // user should be prompted to approve the proposed session permissions displaying also dapp metadata
          console.log("session.proposal", proposal);
          const response: SessionTypes.Response = {
            state: {
              accounts: [`${this.signer.address + "@eip155:" + this.chainId}`],
            },
            metadata: {
              name: "Test Wallet",
              description: "Test wallet desc",
              icons: ["no icon"],
              url: "some url",
            },
          };
          const session = await wc.approve({ proposal, response });
        }
      );
    });
  }
}
