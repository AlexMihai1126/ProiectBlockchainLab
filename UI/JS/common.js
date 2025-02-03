async function connectWallet() {
    if (!window.ethereum) {
        alert("MetaMask este necesar pentru aceasta aplicatie.");
        return null;
    }
    //verifica daca deja e conectat
    let userAddress = localStorage.getItem("userAddress");
    if (userAddress) {
        console.log("Adresa deja gasita:", userAddress);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        return { provider, signer, userAddress };
    } else {
        try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            if (accounts.length === 0) {
                alert("Nu exista conturi.");
                return null;
            }

            userAddress = accounts[0];
            localStorage.setItem("userAddress", userAddress);

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            return { provider, signer, userAddress };
        } catch (error) {
            console.error("Eroare conectare la MetaMask:", error);
            return null;
        }
    }
}

async function getContractInstance(contractName, contractAddress) {
    try {
        //incarca ABI din fisierul json
        const abi = await loadABI(`ABI/${contractName}.json`);

        if (!abi || !Array.isArray(abi)) {
            console.error(`Invalid ABI for contract: ${contractName}`);
            return null;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        return new ethers.Contract(contractAddress, abi, signer);
    } catch (error) {
        console.error(`Eroare la incarcarea contractului: ${contractName}`, error);
        return null;
    }
}

async function loadABI(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Nu s-a putut incarca ABI din fisier: ${path}`);
        }

        const abiData = await response.json();

        if (!Array.isArray(abiData)) {
            console.error(`Format ABI invalid pentru: ${path}`);
            return null;
        }

        return abiData;
    } catch (error) {
        console.error(`Eroare incarcare ABI din: ${path}:`, error);
        return null;
    }
}

function userLogin() {
    if (localStorage.getItem("userAddress") == null) {
        return false;
    } else {
        return true;
    }
}

function disconnect() {
    localStorage.removeItem("userAddress");
    window.location.href = "index.html";
}

function getUserAddress() {
    return localStorage.getItem("userAddress");
}

async function uploadToPinata(file) {
    const JWT = config.pinata.JWT;

    if (!JWT) {
        console.error("Nu s-a gasit JWT pt Pinata in config.js!");
        return null;
    }

    try {
        const formData = new FormData();
        formData.append("file", file);

        const metadata = JSON.stringify({ name: file.name });
        formData.append("pinataMetadata", metadata);

        const options = JSON.stringify({ cidVersion: 1 });
        formData.append("pinataOptions", options);

        const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${JWT}`
            },
            body: formData
        });

        const data = await response.json();
        
        if (data.IpfsHash) {
            console.log("Incarcat pe Pinata IPFS:", data);
            return data.IpfsHash;
        } else {
            console.error("Incarcarea in Pinata IPFS a esuat:", data);
            alert("Eroare la incarcare fisier.");
            return null;
        }
    } catch (error) {
        console.error("Eroare la incarcare fisier in Pinata IPFS:", error);
        return null;
    }
}