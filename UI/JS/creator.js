(async function () {
    if (userLogin() == false) {
        window.location.href = "index.html";
    } else {
        try {
            const userAddress = getUserAddress();
            const appContract = await getContractInstance(config.appContract.name, config.appContract.address);
            if (!appContract) return;

            const creatorContract = await getContractInstance(config.creatorContract.name, config.creatorContract.address);
            if (!creatorContract) return;

            const cidContract = await getContractInstance(config.cidContract.name, config.cidContract.address);
            if (!cidContract) return;

            if (await appContract.verificaInregistrare(userAddress) !== "c") {
                alert("Trebuie sa fii inregistrat ca fotograf pentru a accesa aceasta pagina.");
                window.location.href = "main.html";
            } else {
                const toateCIDFotograf = await cidContract.getFotografiiPerUser(userAddress);
                const castiguri = await creatorContract.getCastiguri(userAddress);
                const castiguriFormatate = ethers.utils.formatEther(castiguri);
                const castiguriDisplay = document.getElementById("earnings");
                if(castiguri > 0){
                    castigBtn = document.getElementById("withdrawEarningsBtn");
                    castigBtn.disabled = false;
                }
                castiguriDisplay.innerHTML = "Castiguri: " + castiguriFormatate + " ETH";
                if (toateCIDFotograf.length === 0) {
                    const mainDiv = document.getElementById("main");
                    const message = document.createElement("h2");
                    message.classList.add("text-center", "text-muted");
                    message.innerHTML = 'Nu exista fotografii incarcate de dvs.';
                    mainDiv.appendChild(message);
                } else {
                    const galerie = document.getElementById("galleryGrid");
                    for (const cid of toateCIDFotograf) {
                        const pozaDisplay = document.createElement("div");
                        const pretFoto = await cidContract.getPretFotografie(cid);
                        const pretFormatat = ethers.utils.formatEther(pretFoto);
                        pozaDisplay.innerHTML = `
                            <div class="card">
                                <div class="card-body text-center">
                                        <img src="https://gateway.pinata.cloud/ipfs/${cid}" class="img-fluid"/>
                                        <p class="mt-2"><strong>Pret:</strong> ${pretFormatat} ETH</p>
                                        <h5 class="text-muted" title="${cid}">Vezi CID</h5>
                                </div>
                            </div>
                            `;
                        pozaDisplay.classList.add("col-lg-3", "col-md-4", "col-sm-6", "mb-3");
                        galerie.appendChild(pozaDisplay);
                    }
                }
                document.getElementById("withdrawEarningsBtn").addEventListener("click", async () => {
                    try {
                        const earnings = await creatorContract.getCastiguri(userAddress);
    
                        if (earnings.toString() === "0") {
                            alert("Nu ai castiguri de retras.");
                            return;
                        }
    
                        const tx = await appContract.retragereCastiguri();
                        await tx.wait();
                        alert("Castiguri retrase cu succes!");
                    } catch (err) {
                        console.error("Eroare la retragere castiguri:", err);
    
                        if (err.message.includes("Nu ai castiguri de retras")) {
                            alert("Nu ai castiguri disponibile pentru retragere.");
                        } else {
                            alert("eroare la retragere castiguri.");
                        }
                    }
                });
            }
        } catch (err) {
            console.error("Eroare la initializarea paginii de fotograf:", err);
        }
    }
})();
