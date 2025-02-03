(async function() {
    if(userLogin() == false){
        window.location.href = "index.html";
    } else {
        try {
            const userAddress = getUserAddress();
      
            const appContract = await getContractInstance(config.appContract.name, config.appContract.address);
            if (!appContract) return;

            const userStatus = await appContract.verificaInregistrare(userAddress);

            if(userStatus !== "o") {
                window.location.href = "main.html";
            } else {
                const taxe = await appContract.getTaxeAcumulate();
                const taxeFormatate = ethers.utils.formatEther(taxe);
                const taxeDisplay = document.getElementById("taxeDisplay");
                taxeDisplay.innerHTML = "Taxe colectate: " + taxeFormatate + " ETH";

                const soldContract = await appContract.getSoldContract();
                const soldContractFormatat = ethers.utils.formatEther(soldContract);
                const soldContractDisplay = document.getElementById("soldDisplay");
                soldContractDisplay.innerHTML = "Suma totala contract: " + soldContractFormatat + " ETH";

                const withdrawFeesBtn = document.getElementById("withdrawFeesBtn");

                if(taxe > 0){
                    withdrawFeesBtn.disabled = false;
                    document.getElementById("withdrawFeesBtn").addEventListener("click", async () => {
                        try {
                            const tx = await appContract.retragereTaxe();
                            await tx.wait();
                            alert("Taxe retrase cu succes!");
                            window.location.reload();
                        } catch (err) {
                            console.error("Eroare la retragere taxe:", err);
                        }
                    });
                }
            }
      
            
        } catch (err) {
            console.error("Eroare la initializare pagina proprietar:", err);
        }
    }
  
})();
