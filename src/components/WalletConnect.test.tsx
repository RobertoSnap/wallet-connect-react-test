import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { WalletClient } from '../utils/WalletClient';
import { WalletConnect } from './WalletConnect';





// test("wallet-connect uri show", async () => {
//   const inputURI = await screen.getByTestId("wallet-connect-uri") as HTMLInputElement
//   console.log("unpuyt uri show,", inputURI)
// })

test('renders connect button', async () => {
  const walletClient = new WalletClient({ relayProvider: "wss://relay.walletconnect.org" })
  const { getByTestId, findByTestId } = render(<WalletConnect />)
  const button = getByTestId("wallet-connect-button");
  button.click()
  expect(button).toBeInTheDocument();

  // eslint-disable-next-line testing-library/await-async-query
  const inputURI = await waitFor(async () => screen.findByTestId("wallet-connect-uri") as Promise<HTMLInputElement>, { interval: 1000, timeout: 5000 });

  expect("value" in inputURI).toBeTruthy()
  expect(inputURI).toBeInTheDocument();
  expect(inputURI.value).toContain("wc:")

  await walletClient.pair(inputURI.value)

  const accountsDiv = await waitFor(async () => screen.findByTestId("wallet-connect-accounts"));
  expect(accountsDiv).toBeInTheDocument();

});
