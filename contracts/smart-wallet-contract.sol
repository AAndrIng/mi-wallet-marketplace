// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title SmartWallet
 * @AAndrIng Implementación de wallet inteligente con funcionalidades de marketplace y características de seguridad mejoradas
 */
contract SmartWallet is ReentrancyGuard, Ownable {
    // Estructuras
    struct Item {
        uint256 id;
        string name;
        uint256 price;
        address owner;
        bool isForSale;
        string metadata; // URI para metadata del item
    }

    struct UserLimits {
        uint256 dailyLimit;
        uint256 dailySpent;
        uint256 lastResetTime;
        bool hasCustomLimits;
    }

    // Variables de estado
    mapping(address => uint256) private balances;
    mapping(uint256 => Item) public items;
    mapping(address => mapping(uint256 => uint256)) private userItems; // usuario -> itemId -> cantidad
    mapping(address => UserLimits) private userLimits;
    
    AggregatorV3Interface private priceFeed;
    uint256 private nextItemId;
    uint256 public defaultDailyLimit = 1 ether; // Límite diario por defecto
    
    // Eventos
    event ItemPurchased(address indexed buyer, uint256 indexed itemId, uint256 price);
    event BalanceUpdated(address indexed user, uint256 newBalance);
    event ItemTransferred(address indexed from, address indexed to, uint256 indexed itemId);
    event DailyLimitUpdated(address indexed user, uint256 newLimit);

    constructor(address _priceFeedAddress) {
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
    }

    /**
     * @AAndrIng Modificador para verificar límites diarios
     */
    modifier checkDailyLimit(uint256 amount) {
        UserLimits storage limits = userLimits[msg.sender];
        
        // Si es el primer uso, establecer límites por defecto
        if (!limits.hasCustomLimits) {
            limits.dailyLimit = defaultDailyLimit;
            limits.hasCustomLimits = true;
        }

        // Resetear contador diario si ha pasado un día
        if (block.timestamp >= limits.lastResetTime + 1 days) {
            limits.dailySpent = 0;
            limits.lastResetTime = block.timestamp;
        }

        // Verificar límite
        require(limits.dailySpent + amount <= limits.dailyLimit, 
                "Excede limite diario");
        _;
        
        // Actualizar gasto diario
        limits.dailySpent += amount;
    }

    /**
     * @AAndrIng Obtiene el precio actual desde el oráculo de Chainlink
     */
    function getLatestPrice() public view returns (int) {
        (
            /* uint80 roundID */,
            int price,
            /* uint startedAt */,
            /* uint timeStamp */,
            /* uint80 answeredInRound */
        ) = priceFeed.latestRoundData();
        return price;
    }

    /**
     * @AAndrIng Permite al usuario modificar su límite diario
     */
    function setDailyLimit(uint256 _newLimit) external {
        require(_newLimit >= 0, "Limite invalido");
        UserLimits storage limits = userLimits[msg.sender];
        limits.dailyLimit = _newLimit;
        limits.hasCustomLimits = true;
        emit DailyLimitUpdated(msg.sender, _newLimit);
    }

    /**
     * @AAndrIng Deposita ETH en la wallet
     */
    function deposit() external payable nonReentrant checkDailyLimit(msg.value) {
        require(msg.value > 0, "Debe enviar ETH");
        balances[msg.sender] += msg.value;
        emit BalanceUpdated(msg.sender, balances[msg.sender]);
    }

    /**
     * @AAndrIng Obtiene el balance del usuario
     */
    function getBalance() external view returns (uint256) {
        return balances[msg.sender];
    }

    /**
     * @AAndrIng Transfiere ETH entre usuarios
     */
    function transfer(address _to, uint256 _amount) 
        external 
        nonReentrant 
        checkDailyLimit(_amount) 
    {
        require(_to != address(0), "Direccion invalida");
        require(_amount > 0, "Monto debe ser mayor a 0");
        require(balances[msg.sender] >= _amount, "Balance insuficiente");
        
        balances[msg.sender] -= _amount;
        balances[_to] += _amount;
        
        emit BalanceUpdated(msg.sender, balances[msg.sender]);
        emit BalanceUpdated(_to, balances[_to]);
    }

    /**
     * @AAndrIng Crea un nuevo item en el marketplace
     */
    function createItem(string memory _name, uint256 _price, string memory _metadata) 
        external 
        returns (uint256) 
    {
        uint256 itemId = nextItemId++;
        items[itemId] = Item({
            id: itemId,
            name: _name,
            price: _price,
            owner: msg.sender,
            isForSale: true,
            metadata: _metadata
        });
        
        userItems[msg.sender][itemId] = 1;
        return itemId;
    }

    /**
     * @AAndrIng Compra un item del marketplace
     */
    function purchaseItem(uint256 _itemId) 
        external 
        nonReentrant 
        checkDailyLimit(items[_itemId].price) 
    {
        Item storage item = items[_itemId];
        require(item.isForSale, "Item no esta a la venta");
        require(item.owner != msg.sender, "No puedes comprar tu propio item");
        require(balances[msg.sender] >= item.price, "Balance insuficiente");
        
        address previousOwner = item.owner;
        
        balances[msg.sender] -= item.price;
        balances[previousOwner] += item.price;
        
        item.owner = msg.sender;
        item.isForSale = false;
        
        userItems[previousOwner][_itemId]--;
        userItems[msg.sender][_itemId]++;
        
        emit ItemPurchased(msg.sender, _itemId, item.price);
        emit BalanceUpdated(msg.sender, balances[msg.sender]);
        emit BalanceUpdated(previousOwner, balances[previousOwner]);
    }
}
