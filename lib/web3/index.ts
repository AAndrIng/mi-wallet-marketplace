// lib/web3/index.ts

import { ethers } from 'ethers';
import Web3Modal from 'web3modal';

// Importamos el ABI de nuestro smart contract
const SmartWalletABI = [
  // Aquí irá el ABI del contrato
  // Lo generaremos después de compilar el contrato
];

export class Web3Client {
  private static instance: Web3Client;
  private web3Modal: Web3Modal;
  private provider?: ethers.providers.Web3Provider;
  private contract?: ethers.Contract;
  
  private constructor() {
    this.web3Modal = new Web3Modal({
      network: "sepolia", // Red de prueba
      cacheProvider: true,
      providerOptions: {} // MetaMask se incluye por defecto
    });
  }

  public static getInstance(): Web3Client {
    if (!Web3Client.instance) {
      Web3Client.instance = new Web3Client();
    }
    return Web3Client.instance;
  }

  // Conectar wallet
  async connectWallet(): Promise<string> {
    try {
      const web3ModalProvider = await this.web3Modal.connect();
      this.provider = new ethers.providers.Web3Provider(web3ModalProvider);
      const signer = this.provider.getSigner();
      const address = await signer.getAddress();

      // Inicializar el contrato
      this.contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
        SmartWalletABI,
        signer
      );

      return address;
    } catch (error) {
      console.error('Error al conectar wallet:', error);
      throw error;
    }
  }

  // Desconectar wallet
  async disconnectWallet(): Promise<void> {
    await this.web3Modal.clearCachedProvider();
    this.provider = undefined;
    this.contract = undefined;
  }

  // Obtener balance
  async getBalance(address: string): Promise<string> {
    if (!this.provider) throw new Error("Wallet no conectada");
    const balance = await this.provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  }

  // Enviar transacción
  async sendTransaction(to: string, amount: string): Promise<ethers.providers.TransactionResponse> {
    if (!this.contract) throw new Error("Contrato no inicializado");
    
    const tx = await this.contract.transfer(to, ethers.utils.parseEther(amount));
    return tx;
  }

  // Comprar item
  async purchaseItem(itemId: number): Promise<ethers.providers.TransactionResponse> {
    if (!this.contract) throw new Error("Contrato no inicializado");
    
    const tx = await this.contract.purchaseItem(itemId);
    return tx;
  }
}

export const web3Client = Web3Client.getInstance();