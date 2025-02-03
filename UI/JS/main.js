(async function () {
    if (userLogin() == false) {
        window.location.href = "index.html";
    } else {
        try {
            const appContract = await getContractInstance(config.appContract.name, config.appContract.address);
            if (!appContract) return;

            const cidContract = await getContractInstance(config.cidContract.name, config.cidContract.address);
            if (!cidContract) return;

            //incarca toate CID-urile din contract
            const toateCID = await cidContract.getToatePozele();

            const userAddress = getUserAddress();
            const userStatus = await appContract.verificaInregistrare(userAddress);
            const navbarStatus = document.getElementById("accountStatus");

            const elem = document.createElement("li");
            elem.classList.add("nav-item");

            if(userStatus === "c") {
                elem.innerHTML = `<a class="nav-link" href="creator.html">Contul meu - fotograf</a>`;
                navbarStatus.append(elem);
            } else if(userStatus === "o") {
                elem.innerHTML = `<a class="nav-link" href="owner.html">Contul meu - proprietar</a>`;
                navbarStatus.append(elem);
            } else {
                elem.innerHTML = `<a class="nav-link" href="user.html">Contul meu - utilizator</a>`;
                navbarStatus.append(elem);
            }

            if (toateCID.length === 0) {
                const mainDiv = document.getElementById("main");
                const message = document.createElement("h2");
                message.classList.add("text-center", "text-muted");
                message.innerHTML = 'Nu exista fotografii in platforma.';
                mainDiv.appendChild(message);
            } else {
                const galerie = document.getElementById("galleryGrid");
                for (const cid of toateCID) {
                    const pozaDisplay = document.createElement("div");
                    const pretFoto = await cidContract.getPretFotografie(cid);
                    const pretFormatat = ethers.utils.formatEther(pretFoto);

                    pozaDisplay.innerHTML = `
                        <div class="card"> 
                            <div class="card-body text-center">
                                <img src="https://gateway.pinata.cloud/ipfs/${cid}" class="img-fluid" />
                                <p class="mt-2"><strong>Pret:</strong> ${pretFormatat} ETH</p>
                                <h5 class="text-muted" title="${cid}">Vezi CID</h5>
                                <div class="d-grid gap-2">
                                    <button class="btn btn-primary buyPhotoBtn" data-cid="${cid}" data-pret="${pretFoto}">Cumpara</button>
                                </div>
                            </div>
                        </div>
                    `;
                    pozaDisplay.classList.add("col-lg-3", "col-md-4", "col-sm-6", "mb-3");

                    const buyPhotoBtn = pozaDisplay.querySelector(".buyPhotoBtn");
                    if(userStatus !== "u") {
                        buyPhotoBtn.disabled = true;
                    }
                    galerie.appendChild(pozaDisplay);
                }
            }

            document.addEventListener("click", async (e) => {
                if (e.target.classList.contains("buyPhotoBtn")) {
                    const cid = e.target.getAttribute("data-cid");
                    const price = e.target.getAttribute("data-pret");
                    try {
                        const tx = await appContract.achizitionareFotografie(cid, { value: price });
                        await tx.wait();
                        alert("Achizitie reusita!");
                    } catch (err) {
                        alert("Achizitie esuata!");
                        console.error("Eroare la achizitie:", err);
                    }
                }
            });
        } catch (err) {
            console.error("Eroare la incarcarea galeriei:", err);
        }
    }
})();
