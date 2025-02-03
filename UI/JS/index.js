window.addEventListener('DOMContentLoaded', async () => {
    const connectWalletBtn = document.getElementById("connectWalletBtn");
    const metamaskMessage = document.getElementById("metamask-message");
    const registrationSection = document.getElementById("registration-section");
    const walletAddressText = document.getElementById("walletAddress");
  
    connectWalletBtn.style.display = "none";
    const userAddress = localStorage.getItem("userAddress");
  
    if (typeof window.ethereum !== 'undefined') {
        metamaskMessage.innerText = 'MetaMask instalat!';
        metamaskMessage.classList.add("text-info");
        if(userAddress === null) {
            connectWalletBtn.style.display = "block";
        }
    } else {
        metamaskMessage.innerText = 'Te rog sa instalezi MetaMask.';
        metamaskMessage.classList.add("text-danger");
        return;
    }
  
    // verificam daca utilizatorul este deja conectat
    
    if (userAddress) {
        walletAddressText.innerText = "Adresa: " + userAddress;
  
        const appContract = await getContractInstance(config.appContract.name, config.appContract.address);
        if (!appContract) return;
  
        try {
            const userType = await appContract.verificaInregistrare(userAddress);
            console.log("Tip user:", userType);
            if(userType == "n"){
                registrationSection.style.display = "block";
            } else {
                window.location.href = "main.html";
            }
            
        } catch (error) {
            console.error("Eroare la verificare status cont:", error);
        }
    }
  
    //event pe click buton inregistrare
    connectWalletBtn.addEventListener("click", async () => {
        const { userAddress } = await connectWallet();
        if (!userAddress) return;
        walletAddressText.innerText = "Adresa: " + userAddress;
  
        const appContract = await getContractInstance(config.appContract.name, config.appContract.address);
        if (!appContract) return;
  
        try {
            const userType = await appContract.verificaInregistrare(userAddress);
            console.log("Tip user:", userType);
  
            if (userType === "n") {
                registrationSection.style.display = "block"; 
            } else {
                registrationSection.style.display = "none";
                alert("Aveti cont pe site. Redirectionare catre pagina principala.");
                window.location.href = "main.html";
            }
        } catch (error) {
            console.error("Eroare la conectare cont:", error);
        }
    });
  
    //buton de inregistrare
    document.getElementById("registerBtn").addEventListener("click", async () => {
        const accountType = document.querySelector('input[name="accountType"]:checked').value;
        const appContract = await getContractInstance(config.appContract.name, config.appContract.address);
        if (!appContract) return;
  
        try {
            if (accountType === "user") {
                await appContract.inregistrareUtilizator();
            } else {
                await appContract.inregistrareFotograf();
            }
            alert("Inregistrare reusita!");
            window.location.href = "main.html";
        } catch (err) {
            console.error("Eroare la inregistrare:", err);
            alert("Eroare la inregistrare.");
        }
    });
  });
  