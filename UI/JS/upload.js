(async function() {
    if(userLogin() == false){
        window.location.href = "index.html";
    } else {
        try {
            const userAddress = getUserAddress();
    
            const appContract = await getContractInstance(config.appContract.name, config.appContract.address);
            if (!appContract) return;

            const userStatus = await appContract.verificaInregistrare(userAddress);

            if(userStatus !== "c") {
                window.location.href = "main.html";
            } else {
                document.getElementById("uploadForm").addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const fileInput = document.getElementById("fileInput");
                    const priceInput = document.getElementById("priceInput");
        
                    if (fileInput.files.length === 0) {
                        alert("Trebuie sa incarci un fisier.");
                        return;
                    }
        
                    const file = fileInput.files[0];
                    const price = priceInput.value;
        
                    try {
                        const ipfsHash = await uploadToPinata(file);
                        if (!ipfsHash) {
                            alert("Incarcarea a esuat.");
                            return;
                        }
        
                        alert(`Fisier incarcat cu succes! CID: ${ipfsHash}`);
        
                        const tx = await appContract.incarcareFotografie(ipfsHash, ethers.utils.parseEther(price));
                        await tx.wait();
                        alert("Fotografie inregistrata pe blockchain!");
        
                        window.location.href = "creator.html";
                    } catch (error) {
                        console.error("Eroare in pagina de upload:", error);
                    }
                });
            }
        } catch (err) {
            console.error("Eroare la initializarea paginii de upload:", err);
        }
    }
})();
