// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title DateUtilizatori - se ocupa de informatiile utilizatorilor
contract DateUtilizatori is Ownable {
    uint8 private constant MIN_USER_LVL = 1;
    uint8 private constant MAX_USER_LVL = 4;

    address private mainContract = address(0);

    struct Utilizator {
        bool inregistrat;
        uint8 nivel;
        string[] cidAchizitionate;
    }

    mapping(address => Utilizator) private utilizatori;

    event UtilizatorInregistrat(address indexed utilizator);
    event CIDAchizitionat(address indexed utilizator, string indexed cid);

    constructor() Ownable(msg.sender) {}

    modifier onlyMainContract() {
        require(msg.sender == mainContract, "Doar contractul principal poate apela aceasta functie.");
        _;
    } // fortam ca functiile ce au acest modifier sa poata fi apelate doar din contractul main

    function setAppContract(address _mainContract) external onlyOwner {
        mainContract = _mainContract;
    }

    function inregistrareUtilizator(address _utilizator) external {
        require(!utilizatori[_utilizator].inregistrat, "Utilizator deja inregistrat.");
        utilizatori[_utilizator].inregistrat = true;
        utilizatori[_utilizator].nivel = MIN_USER_LVL;
        emit UtilizatorInregistrat(_utilizator);
    }

    function adaugaCIDAchizitionat(address _utilizator, string memory _cid) onlyMainContract external  {
        require(utilizatori[_utilizator].inregistrat, "Utilizator neinregistrat.");
        utilizatori[_utilizator].cidAchizitionate.push(_cid);
        emit CIDAchizitionat(_utilizator, _cid);
    }

    function getCIDAchizitionate(address _utilizator) external view returns (string[] memory) {
        return utilizatori[_utilizator].cidAchizitionate;
    }

    function verificaUtilizatorInregistrat(address _utilizator) external view returns (bool) {
        return utilizatori[_utilizator].inregistrat;
    }
}

/// @title DateFotografi - se ocupa de informatiile fotografilor
contract DateFotografi is Ownable {
    uint8 private constant MIN_CREATOR_LVL = 1;
    uint8 private constant MAX_CREATOR_LVL = 4;

    struct Fotograf {
        bool inregistrat;
        uint256 castiguri;
        uint8 nivel;
    }

    address private mainContract = address(0);

    mapping(address => Fotograf) private fotografi;

    event FotografInregistrat(address indexed creator);

    constructor() Ownable(msg.sender) {}

    modifier onlyMainContract() {
        require(msg.sender == mainContract, "Doar contractul principal poate apela aceasta functie.");
        _;
    } // fortam ca functiile ce au acest modifier sa poata fi apelate doar din contractul main

    function setAppContract(address _mainContract) external onlyOwner {
        mainContract = _mainContract;
    }

    function inregistrareFotograf(address _fotograf) external {
        require(!fotografi[_fotograf].inregistrat, "Fotograf deja inregistrat.");
        fotografi[_fotograf].inregistrat = true;
        fotografi[_fotograf].nivel = MIN_CREATOR_LVL;
        emit FotografInregistrat(_fotograf);
    }

    function adaugaCastiguri(address _fotograf, uint256 _valoare) external onlyMainContract {
        require(fotografi[_fotograf].inregistrat, "Fotoraf neinregistrat.");
        fotografi[_fotograf].castiguri += _valoare;
    }

    function getCastiguri(address _fotograf) external view returns (uint256) {
        return fotografi[_fotograf].castiguri;
    }

    function stergeCastiguri(address _fotograf) external onlyMainContract {
        fotografi[_fotograf].castiguri = 0;
    }

    function esteFotografInregistrat(address _fotograf) external view returns (bool) {
        return fotografi[_fotograf].inregistrat;
    }
}

/// @title CIDData - se ocupa de informatiile despre fotografiile (CID-urile) incarcate
contract CIDData is Ownable {
    struct CID {
        string cidStr;
        address fotograf;
        uint256 pret;
    }

    address private mainContract = address(0);

    mapping(string => CID) private cid_uri; // mapeaza CID-ul string la structura CID
    mapping(address => string[]) private mapFotograf_CID_uri; // mapeaza fotograful cu cid-urile publicate de el
    string[] private toateCID; // toate cid-urile din platforma

    event FotografieInregistrata(string indexed cid, address indexed fotograf, uint256 pret);

    constructor() Ownable(msg.sender) {} //daca da fail - argument owner este contractul main

    modifier onlyMainContract() {
        require(msg.sender == mainContract, "Doar contractul principal poate apela aceasta functie.");
        _;
    } // fortam ca functiile ce au acest modifier sa poata fi apelate doar din contractul main

    function setAppContract(address _mainContract) external onlyOwner {
        mainContract = _mainContract;
    }

    function inregistrareCID(string memory _cid, address _fotograf, uint256 _pret) onlyMainContract external {
        require(bytes(cid_uri[_cid].cidStr).length == 0, "Fotografia a fost deja inregistrata");
        require(_pret > 0, "Pretul trebuie sa fie mai mare ca 0.");
        cid_uri[_cid] = CID({ cidStr: _cid, fotograf: _fotograf, pret: _pret });
        mapFotograf_CID_uri[_fotograf].push(_cid); // adaugam CID-ul inregistrat in map-ul fotografului
        toateCID.push(_cid); // adaugam CID-ul in array-ul global
        emit FotografieInregistrata(_cid, _fotograf, _pret);
    }

    function getFotografiiPerUser(address _fotograf) external view returns (string[] memory) {
        return mapFotograf_CID_uri[_fotograf]; // preluam din map cid-urile publicate de un fotograf
    }

    function getCreatorPoza(string memory _cid) external view returns (address) {
        return cid_uri[_cid].fotograf; // obtine creatorul pozei dupa CID
    }

    function getToatePozele() external view returns (string[] memory) {
        return toateCID; // obtine toate pozele din platforma
    }

    function getPretFotografie(string memory _cid) external view returns (uint256) {
        return cid_uri[_cid].pret; // obtine pret fotografie dupa CID
    }
}

/// @title AppContract - pune cap la cap toate celelalte subcontracte
contract AppContract is Ownable {
    DateUtilizatori userContract;
    DateFotografi creatorContract;
    CIDData cidContract;

    uint256 private taxeAcumulate = 0;
    uint256 private constant TAXA_PLATFORMA = 10;

    event FotografieAchizitionata(address indexed cumparator, string indexed cid, uint256 suma);
    event CastiguriRetrase(address indexed fotograf, uint256 suma);
    event TaxeRetrase(uint256 suma);

    event TestValoare(uint256 valTx, uint256 pretCerut);

    constructor(
        address _userContractAddr,
        address _creatorContractAddr,
        address _cidContractAddr
    ) Ownable(msg.sender) {
        userContract = DateUtilizatori(_userContractAddr);
        creatorContract = DateFotografi(_creatorContractAddr);
        cidContract = CIDData(_cidContractAddr);
    }

    function inregistrareUtilizator() external {
        userContract.inregistrareUtilizator(msg.sender);
    }

    function inregistrareFotograf() external {
        creatorContract.inregistrareFotograf(msg.sender);
    }

    function verificaInregistrare(address _cont) external view returns (string memory) {
        bool utilizatorInregistrat = userContract.verificaUtilizatorInregistrat(_cont);
        bool fotografInregistrat = creatorContract.esteFotografInregistrat(_cont);
        bool isOwner = (_cont == owner());

        if (utilizatorInregistrat) {
            return "u"; //utilizator
        } else if (fotografInregistrat) {
            return "c"; //creator
        } else if (isOwner) {
            return "o"; //owner
        } else {
            return "n"; //neinregistrat
        }
    }

    function incarcareFotografie(string memory _cid, uint256 _pret) external {
        require(creatorContract.esteFotografInregistrat(msg.sender), "Fotograf neinregistrat");
        cidContract.inregistrareCID(_cid, msg.sender, _pret);
    }

    function achizitionareFotografie(string memory _cid) external payable {
        require(userContract.verificaUtilizatorInregistrat(msg.sender), "Utilizator neinregistrat");
        address fotograf = cidContract.getCreatorPoza(_cid);
        require(fotograf != address(0), "Fotografia nu exista");
        uint256 pretFoto = cidContract.getPretFotografie(_cid);
        uint256 valoareTranzactie = msg.value;
        emit TestValoare(valoareTranzactie, pretFoto);
        require(valoareTranzactie == pretFoto, "Plata necesara");

        uint256 taxaPlatforma = msg.value / TAXA_PLATFORMA; // Taxa platformei
        uint256 castigFotograf = msg.value - taxaPlatforma; // Castigul fotografului

        taxeAcumulate += taxaPlatforma;
        creatorContract.adaugaCastiguri(fotograf, castigFotograf);
        userContract.adaugaCIDAchizitionat(msg.sender, _cid); // Inregistram achizitia

        emit FotografieAchizitionata(msg.sender, _cid, msg.value);
    }

    function retragereCastiguri() external {
        require(creatorContract.esteFotografInregistrat(msg.sender), "Nu esti fotograf inregistrat");
        uint256 suma = creatorContract.getCastiguri(msg.sender);
        require(suma > 0, "Nu ai castiguri de retras");
        creatorContract.stergeCastiguri(msg.sender);
        payable(msg.sender).transfer(suma);
        emit CastiguriRetrase(msg.sender, suma);
    }

    function retragereTaxe() onlyOwner external {
        require(taxeAcumulate > 0, "Nu exista fonduri de retras");
        uint256 suma = taxeAcumulate;
        taxeAcumulate = 0;
        payable(owner()).transfer(suma);
        emit TaxeRetrase(suma);
    }

    function getSoldContract() onlyOwner external view returns (uint256) {
        return address(this).balance;
    }

    function getTaxeAcumulate() onlyOwner external view returns (uint256) {
        return taxeAcumulate;
    }
}