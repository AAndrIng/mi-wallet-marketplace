// components/WalletConnectButton.tsx

import { useWallet } from '../lib/web3/hooks';

export default function WalletConnectButton() {
  const { address, isConnecting, error, connect, disconnect } = useWallet();

  return (
    <div>
      {error && (
        <div className="text-red-500 text-sm mb-2">{error}</div>
      )}
      
      {address ? (
        <div className="flex flex-col items-end gap-2">
          <span className="text-sm text-gray-600">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <button
            onClick={disconnect}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Desconectar Wallet
          </button>
        </div>
      ) : (
        <button
          onClick={connect}
          disabled={isConnecting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
        >
          {isConnecting ? 'Conectando...' : 'Conectar Wallet'}
        </button>
      )}
    </div>
  );
}