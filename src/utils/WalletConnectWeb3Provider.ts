import { ethers } from "ethers";
import WalletConnectClient, { CLIENT_EVENTS } from "@walletconnect/client";
import { PairingTypes, BlockchainTypes } from "@walletconnect/types";
import { InfuraNetworks, INFURA_NETWORKS } from "./WalletConnectConstants";
const DEFAULT_RPC_URL = "http://localhost:8545";

type RPCConfig =
  | string
  | {
      [chainId: number]: string;
    }
  | { infuraId: string };

interface WalletConnectWeb3ProviderOptions {
  rpc: RPCConfig;
  relayProvider: string;
  chainId: number;
}

export class WalletConnectWeb3Provider extends ethers.providers
  .JsonRpcProvider {
  walletConnectClient: Promise<WalletConnectClient>;
  uri?: string;
  accounts?: Array<string>;
  chainId?: number;
  networkId?: number;
  rpcConfig: RPCConfig;
  listener?: Promise<void>;

  constructor(_options: Partial<WalletConnectWeb3ProviderOptions> = {}) {
    super(WalletConnectWeb3Provider._getRPCUrl(_options.rpc, _options.chainId));
    const options: WalletConnectWeb3ProviderOptions = {
      relayProvider: "ws://0.0.0.0:5555",
      rpc: DEFAULT_RPC_URL,
      chainId: 1,
      ..._options,
    };
    this.walletConnectClient = WalletConnectClient.init({
      relayProvider: options.relayProvider,
      // logger: "warn",
    });
    this.rpcConfig = options.rpc;
    this.listener = this.listen();
  }

  private getRPCUrl(rpcConfig?: RPCConfig, chainId?: keyof InfuraNetworks) {
    return WalletConnectWeb3Provider._getRPCUrl(rpcConfig, chainId);
  }
  private static _getRPCUrl(
    rpcConfig?: RPCConfig,
    chainId?: keyof InfuraNetworks
  ) {
    if (!rpcConfig) return DEFAULT_RPC_URL;
    const _chainId = chainId ? chainId : 1;
    if (typeof rpcConfig === "string") {
      return rpcConfig;
    }
    if ("infuraId" in rpcConfig) {
      const infuraNetwork: InfuraNetworks = INFURA_NETWORKS;

      if (!Object.prototype.hasOwnProperty.call(infuraNetwork, _chainId)) {
        throw Error(
          "Infura network has not be configured by WalletConnectWeb3Provider for chainId" +
            chainId
        );
      }
      const network = infuraNetwork[_chainId];
      return `https://${network}.infura.io/v3/${rpcConfig.infuraId}`;
    }
    if (!Object.prototype.hasOwnProperty.call(rpcConfig, _chainId)) {
      throw Error("Please set an RPC for chainID" + chainId);
    }
    return rpcConfig[_chainId];
  }

  private listen = (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      const wc = await this.walletConnectClient;
      console.log("dAPP listening");
      wc.on(
        CLIENT_EVENTS.pairing.proposal,
        async (proposal: PairingTypes.Proposal) => {
          console.log("CLIENT_EVENTS.pairing.proposal");
          const { uri } = proposal.signal.params;
          this.uri = uri;
          this.emit("uri", uri);
        }
      );
      // wc.on(CLIENT_EVENTS.pairing.created, async (payload: any) => {
      //   console.log("CLIENT_EVENTS.pairing.created", payload);
      // });
      // wc.on(CLIENT_EVENTS.pairing.updated, async (payload: any) => {
      //   console.log("CLIENT_EVENTS.pairing.updated", payload);
      // });
      wc.on(
        CLIENT_EVENTS.pairing.deleted,
        async (proposal: PairingTypes.DeleteParams) => {
          reject(proposal.reason);
        }
      );
      wc.on("modal_closed", () => {
        reject("User closed modal");
      });
    });
  };

  enable = async () => {
    await this.walletConnectClient;
    console.log("enable - create session");
    const session = await this.createSession();
    console.log("dAPP: Session created", session);
    this.updateState(session.state);
    return this.accounts;
  };

  async updateState(state: BlockchainTypes.State) {
    const { accounts } = state;
    // Check if accounts changed and trigger event
    if (!this.accounts || (accounts && this.accounts !== accounts)) {
      this.accounts = accounts;
      this.emit("accountsChanged", accounts);
    }
    // TODO chainChanged, networkChanged, rpcChanged, BlockchainChanged? :D
  }

  createSession = async () => {
    const wc = await this.walletConnectClient;
    return await wc.connect({
      metadata: {
        name: "Brreg - Forvalt",
        description: "Example Dapp",
        url: "http://argent.io",
        icons: ["https://walletconnect.org/walletconnect-logo.png"],
      },
      permissions: {
        blockchain: {
          chains: ["eip155:123"],
        },
        jsonrpc: {
          methods: [
            "eth_sendTransaction",
            "personal_sign",
            "eth_signTypedData",
          ],
        },
      },
    });
  };
}
