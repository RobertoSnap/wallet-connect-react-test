import WalletConnect, { CLIENT_EVENTS } from "@walletconnect/client";
import { ethers } from "ethers";
import WalletConnectClient from "@walletconnect/client";
import { AppMetadata, SessionTypes } from "@walletconnect/types";

export interface WalletClientOptions {
  privateKey: string;
  chainId: number;
  rpcURL: string;
  relayProvider: string;
  metadata: AppMetadata;
}

export class WalletClient {
  readonly provider: ethers.providers.JsonRpcProvider;
  readonly signer: ethers.Wallet;
  readonly chainId: number;
  readonly walletConnectClient: Promise<WalletConnect>;
  readonly listener?: Promise<void>;
  readonly options: WalletClientOptions;

  constructor(_options: Partial<WalletClientOptions> = {}) {
    const options: WalletClientOptions = {
      privateKey:
        "0xaa3e538de51965294585ec80092ce534d3042c0b8f47e5c17b8c8259ddf6c79c",
      chainId: 123,
      rpcURL: "http://localhost:8545",
      relayProvider: "ws://0.0.0.0:5555",
      metadata: {
        name: "Test wallet",
        description: "Just a Wallet client for testing",
        icons: ["https://walletconnect.org/walletconnect-logo.png"],
        url: "https://walletconnect.io",
      },
      ..._options,
    };
    this.options = options;
    const wallet = new ethers.Wallet(options.privateKey);
    this.chainId = options.chainId;
    const rpcURL = options.rpcURL;
    this.provider = new ethers.providers.JsonRpcProvider(rpcURL);
    this.signer = wallet.connect(this.provider);
    this.walletConnectClient = WalletConnectClient.init({
      relayProvider: options.relayProvider,
      controller: true,
      // storageOptions: {
      //   database: "WalletClientDatabase.db",
      //   tableName: "test1",
      // },
      // logger: "warn",
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
          console.log("MOBILE: session.proposal", proposal);
          const response: SessionTypes.Response = {
            state: {
              accounts: [`${this.signer.address + "@eip155:" + this.chainId}`],
            },
            metadata: this.options.metadata,
          };
          const session = await wc.approve({ proposal, response });
        }
      );
    });
  }
}
