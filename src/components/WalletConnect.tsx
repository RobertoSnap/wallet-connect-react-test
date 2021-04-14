import React, { useState } from 'react';
import { WalletConnectWeb3Provider } from './../utils/WalletConnectWeb3Provider';

interface Props { }

export const WalletConnect: React.FC<Props> = ({ ...props }) => {
    const [uri, setUri] = useState<string>();
    const [accounts, setAccounts] = useState<string[]>([]);

    const handleConnect = async () => {
        const web3Provider = new WalletConnectWeb3Provider()
        web3Provider.on("uri", (uri) => {
            setUri(uri)
        })
        // await web3Provider.walletConnectClient
        const accounts = await web3Provider.enable()
        console.log("Acocunts", accounts)
        if (accounts) {
            setAccounts(accounts)
        }
    }

    return (
        <div style={{ marginTop: "300px" }}>
            <button data-testid="wallet-connect-button" onClick={() => handleConnect()}>Connect</button>
            {uri &&
                <div>
                    <textarea rows={50} cols={50} defaultValue={uri} data-testid="wallet-connect-uri"></textarea>
                    <a target={"_blank"} rel="noreferrer" href={"http://localhost:3001?token=" + uri}>Koble til</a>
                </div>
            }
            {accounts &&
                <div data-testid="wallet-connect-accounts">
                    <p ></p>
                </div>
            }
        </div>
    )
}