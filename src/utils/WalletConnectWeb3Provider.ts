import { ethers } from "ethers";
import WalletConnectClient, { CLIENT_EVENTS } from "@walletconnect/client";
import {
  PairingTypes,
  BlockchainTypes,
  SessionTypes,
} from "@walletconnect/types";
import { InfuraNetworks, INFURA_NETWORKS } from "./WalletConnectConstants";
import { Session } from "node:inspector";
import { Deferrable } from "ethers/lib/utils";
import { WalletConnectSigner } from "./WalletConnectSigner";
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
      relayProvider: "wss://relay.walletconnect.org",
      rpc: DEFAULT_RPC_URL,
      chainId: 1,
      ..._options,
    };
    this.walletConnectClient = WalletConnectClient.init({
      relayProvider: options.relayProvider,
      logger: "warn",
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

  // async sendTransaction(
  //   transaction: Deferrable<ethers.providers.TransactionRequest>
  // ): Promise<ethers.providers.TransactionResponse> {
  //   const wc = await this.walletConnectClient;
  //   const res: string = await wc.request({
  //     request: {
  //       method: "eth_sendTransaction",
  //       params: transaction,
  //     },
  //     topic: wc.session.topics[0],
  //   });
  //   console.log("send tx res", res);
  //   const txRes = await this.getTransaction(res);
  //   return txRes;
  // }

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
      wc.on(CLIENT_EVENTS.pairing.updated, async (payload: any) => {
        console.log("CLIENT_EVENTS.pairing.updated", payload);
      });
      wc.on(
        CLIENT_EVENTS.session.updated,
        async (session: SessionTypes.Settled) => {
          console.log("CLIENT_EVENTS.session.updated", session);
          this.updateState(session);
        }
      );
      wc.on(
        CLIENT_EVENTS.pairing.deleted,
        async (proposal: PairingTypes.DeleteParams) => {
          reject(proposal.reason);
        }
      );
      wc.on(CLIENT_EVENTS.session.created, (session: SessionTypes.Settled) => {
        console.log("EVENT", "session_created");
        console.log(session);
      });
      wc.on("modal_closed", () => {
        reject("User closed modal");
      });
    });
  };

  enable = async () => {
    const wc = await this.walletConnectClient;
    const session = await this.createSession();
    this.updateState(session);
    return this.accounts;
  };

  async updateState(session: SessionTypes.Settled) {
    const { accounts } = session.state;
    // Check if accounts changed and trigger event
    if (!this.accounts || (accounts && this.accounts !== accounts)) {
      this.accounts = accounts;
      this.emit("accountsChanged", accounts);
    }
    // TODO chainChanged, networkChanged, rpcChanged, BlockchainChanged? :D
  }

  createSession = async () => {
    const wc = await this.walletConnectClient;

    // Do we need to create a new session
    const sessions_string = localStorage.getItem(
      "wc@2:client//session:settled"
    );
    const sessions = wc.session.values;
    if (sessions.length > 0) {
      try {
        // Todo Find out which session is last and check if its not expired
        const selectedSession = sessions[0];
        await wc.session.settled.set(selectedSession.topic, selectedSession, {
          relay: selectedSession.relay,
        });
        const session = await wc.session.get(sessions[0].topic);
        return session;
      } catch (error) {
        console.log("Couldt not set old session, creating new");
      }
    }

    return await wc.connect({
      metadata: {
        name: "Brreg - Forvalt",
        description: "Example Dapp",
        url: "http://argent.io",
        icons: ["https://walletconnect.org/walletconnect-logo.png"],
      },
      permissions: {
        blockchain: {
          chains: ["eip155:2018"],
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
