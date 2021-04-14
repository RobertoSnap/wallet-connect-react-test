import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { WalletClient } from '../utils/WalletClient';
import { WalletConnect } from './WalletConnect';





// test("wallet-connect uri show", async () => {
//   const inputURI = await screen.getByTestId("wallet-connect-uri") as HTMLInputElement
//   console.log("unpuyt uri show,", inputURI)
// })
test('renders connect button', async () => {
  const walletClient = new WalletClient()
  const { getByTestId } = render(<WalletConnect />);
  const button = screen.getByTestId("wallet-connect-button");
  button.click()
  expect(button).toBeInTheDocument();

  await waitFor(async () => {
    const inputURI = await getByTestId("wallet-connect-uri") as HTMLInputElement
    expect(inputURI).toBeInTheDocument();
    expect(inputURI.value).toContain("wc:")

    await walletClient.pair(inputURI.value)

  }, { interval: 1000, timeout: 5000 });

  await waitFor(async () => {
    const accountsDiv = await getByTestId("wallet-connect-accounts") as HTMLDivElement
    expect(accountsDiv).toBeInTheDocument();


  }, { interval: 1000, timeout: 15000 });

});
