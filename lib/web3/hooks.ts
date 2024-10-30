// lib/web3/hooks.ts

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { web3Client } from './index';
import { ethers } from 'ethers';

export function useWallet() {
  const { data: session, update } = useSession();
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');

  // Conectar wallet
  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError('');
      const walletAddress = await web3Client.connectWallet();
      setAddress(walletAddress);
      
      // Actualizar la sesión con la dirección de la wallet
      await update({
        ...session,
        user: {
          ...session?.user,
          walletAddress
        }
      });

      // Obtener balance
      const newBalance = await web3Client.getBalance(walletAddress);
      setBalance(newBalance);
    } catch (err) {
      setError('Error al conectar wallet');
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  }, [session, update]);

  // Desconectar wallet
  const disconnect = useCallback(async () => {
    try {
      await web3Client.disconnectWallet();
      setAddress('');
      setBalance('0');
      
      // Actualizar la sesión
      await update({
        ...session,
        user: {
          ...session?.user,
          walletAddress: ''
        }
      });
    } catch (err) {
      console.error('Error al desconectar:', err);
    }
  }, [session, update]);

  // Enviar transacción
  const sendTransaction = useCallback(async (to: string, amount: string) => {
    try {
      setError('');
      const tx = await web3Client.sendTransaction(to, amount);
      await tx.wait();
      
      // Actualizar balance
      if (address) {
        const newBalance = await web3Client.getBalance(address);
        setBalance(newBalance);
      }
      
      return tx;
    } catch (err) {
      setError('Error en la transacción');
      throw err;
    }
  }, [address]);

  // Efecto para cargar el balance
  useEffect(() => {
    if (address) {
      web3Client.getBalance(address)
        .then(setBalance)
        .catch(console.error);
    }
  }, [address]);

  return {
    address,
    balance,
    isConnecting,
    error,
    connect,
    disconnect,
    sendTransaction
  };
}