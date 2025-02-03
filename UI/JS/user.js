(async function() {
    if(userLogin() == false){
        window.location.href = "index.html";
    }else {
        try {
            const userAddress = getUserAddress();
            const userContract = await getContractInstance(config.userContract.name, config.userContract.address);
            if (!userContract) return;
      
            const achizitiiCID = await userContract.getCIDAchizitionate(userAddress);

            if (achizitiiCID.length === 0) {
                const mainDiv = document.getElementById("main");
                const message = document.createElement("h2");
                message.classList.add("text-center", "text-muted");
                message.innerHTML = 'Nu ai achizitionat fotografii.';
                mainDiv.appendChild(message);
            } else {
                const galerie = document.getElementById("galleryGrid");
                for (const cid of achizitiiCID){
                    const pozaDisplay = document.createElement("div");
                    pozaDisplay.innerHTML = `
                        <div class="card">
                            <div class="card-body text-center">
                                <img src="https://gateway.pinata.cloud/ipfs/${cid}" class="img-fluid" />
                                <h5 class="text-muted" title="${cid}">Vezi CID</h5>
                            </div>
                        </div>
                    `;
                    pozaDisplay.classList.add("col-lg-3", "col-md-4", "col-sm-6", "mb-3");
                    galerie.appendChild(pozaDisplay);
                }
            }
        } catch (err) {
            console.error("Eroare la incarcarea achizitiilor:", err);
        }
    }
})();
