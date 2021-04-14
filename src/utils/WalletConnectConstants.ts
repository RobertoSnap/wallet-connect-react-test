export const INFURA_NETWORKS = {
  1: "mainnet",
  3: "ropsten",
  4: "rinkeby",
  5: "goerli",
  42: "kovan",
};

export interface InfuraNetworks {
  [id: number]: string;
}
