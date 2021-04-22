import { Signer } from 'crypto';
import { ethers } from 'ethers';
import React, { useState } from 'react';
import { ERC20Token } from '../utils/ERC20Token';
import { ERC20Token__factory } from '../utils/ERC20Token__factory';
import { WalletConnectSigner } from '../utils/WalletConnectSigner';
import { WalletConnectWeb3Provider } from './../utils/WalletConnectWeb3Provider';

interface Props { }

export const WalletConnect: React.FC<Props> = ({ ...props }) => {
    const [uri, setUri] = useState<string>();
    const [accounts, setAccounts] = useState<string[]>([]);
    const [signer, setSigner] = useState<WalletConnectSigner>();
    const [erc20, setErc20] = useState<ERC20Token>();

    const handleConnect = async () => {
        // const _web3Provider = new WalletConnectWeb3Provider({
        //     relayProvider: "wss://relay.walletconnect.org"
        // })
        const walletConnectSigner = new WalletConnectSigner().connect(new ethers.providers.JsonRpcProvider("http://localhost:8545"))
        walletConnectSigner.uri.then(uri => {
            setUri(uri)
        })
        const accounts = await walletConnectSigner.enable()
        console.log("Acocunts", accounts)
        if (accounts) {
            setAccounts(accounts.map(address => address.split("@")[0]))
            setSigner(walletConnectSigner)
        }
    }

    const deployERC20 = async () => {
        if (!signer) {
            throw Error("web3Provider not initialized")
        }
        const erc20Factory = new ERC20Token__factory(signer);
        const erc20 = await erc20Factory.deploy("The test token", "tst", 18);
        await erc20.deployed();
        const balanceToMint = ethers.utils.parseEther("500");
        console.log(accounts[0])
        const mintTx = await erc20.mint(accounts[0], balanceToMint);
        await mintTx.wait();
        const tokenBalance = await erc20.balanceOf(accounts[0]);
        setErc20(erc20)
    }

    return (
        <div style={{ marginTop: "300px" }}>
            <button data-testid="wallet-connect-button" onClick={() => handleConnect()}>Connect</button>
            {uri &&
                <div>
                    <textarea rows={5} cols={50} defaultValue={uri} data-testid="wallet-connect-uri"></textarea>
                    <a target={"_blank"} rel="noreferrer" href={"http://localhost:3001/wallet-connect?wc-uri=" + encodeURIComponent(uri) + "&callback-url=" + encodeURIComponent(document.URL)}>Koble til</a>
                </div>
            }
            {accounts.length > 0 &&
                <div data-testid="wallet-connect-accounts">
                    <p>Connected with accounts:</p>
                    {accounts.map(account => (
                        <div key={account}><p>{account}</p>
                        </div>
                    ))}
                </div>
            }
            {accounts.length > 0 &&
                <div>
                    <button data-testid="wallet-connect-deploy-erc20" onClick={() => deployERC20()}>Deploy ERC20</button>
                </div>
            }
            {erc20 &&
                <div>
                    <p>ERC20 deployed</p>
                </div>
            }
        </div>
    )
}