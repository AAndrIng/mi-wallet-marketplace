import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { ethers } from 'ethers';
import { GoogleLogin } from 'react-google-login';

import Layout from './components/Layout';
import WalletConnectButton from './components/WalletConnectButton';
import SmartWalletContract from './lib/web3/SmartWallet.json';

const WalletDashboard = () => {
  const [theme, setTheme] = useState('light');
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [userInfo, setUserInfo] = useState({
    isLoggedIn: false,
    email: '',
    wallet: {
      isConnected: false,
      address: '',
      balance: '0',
      dailyTxCount: 0,
      dailyTxVolume: '0'
    }
  });

  const [securitySettings, setSecuritySettings] = useState({
    dailyLimit: '1',
    txLimit: '0.5',
    maxDailyTx: 5,
    requireExtraConfirmation: true
  });

  const [contract, setContract] = useState(null);

  useEffect(() => {
    const initializeContract = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        const signer = provider.getSigner();
        const contractInstance = new ethers.Contract(
          process.env.NEXT_PUBLIC_SMART_WALLET_ADDRESS,
          SmartWalletContract.abi,
          signer
        );
        setContract(contractInstance);

        // Obtener información de la wallet del usuario
        const balance = await contractInstance.getBalance();
        setUserInfo((prevState) => ({
          ...prevState,
          wallet: {
            ...prevState.wallet,
            isConnected: true,
            address: await signer.getAddress(),
            balance: ethers.utils.formatEther(balance)
          }
        }));
      } catch (error) {
        console.error('Error initializing contract:', error);
      }
    };

    initializeContract();
  }, []);

  const handleGoogleLogin = async (response) => {
    try {
      // Verificar autenticación con Google
      const { profileObj } = response;
      setUserInfo((prevState) => ({
        ...prevState,
        isLoggedIn: true,
        email: profileObj.email
      }));

      // Asociar wallet a usuario
      await contract.associateWallet(profileObj.email, {
        value: ethers.utils.parseEther('0.01')
      });
    } catch (error) {
      console.error('Error logging in with Google:', error);
    }
  };

  const ThemeToggle = () => (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );

  // Otras funciones de interacción con el contrato inteligente...

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Mi Wallet</h1>
          <ThemeToggle />
        </div>

        {!userInfo.isLoggedIn ? (
          <div className="flex justify-center items-center h-[80vh]">
            <GoogleLogin
              clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
              buttonText="Iniciar sesión con Google"
              onSuccess={handleGoogleLogin}
              onFailure={(error) => console.error('Error logging in with Google:', error)}
              cookiePolicy={'single_host_origin'}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Layout
              walletStatus={userInfo.wallet}
              securitySettings={securitySettings}
              onUpdateSecuritySettings={handleSetDailyLimit}
              onDeposit={handleDeposit}
              onTransfer={handleTransfer}
            />
            {/* Aquí podrías agregar más paneles, como el de transacciones, balance, etc. */}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletDashboard;