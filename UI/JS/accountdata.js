(async function() {
    if(userLogin() == false){
        window.location.href = "index.html";
    } else {
        try {
            const { signer, provider, userAddress } = await connectWallet();
            document.getElementById("walletAddress").innerText = "Adresa wallet: " + userAddress;
            const fonduri = await provider.getBalance(userAddress);
            const fonduriFormatate = ethers.utils.formatEther(fonduri);
            document.getElementById("walletBalance").innerText = `Ai in cont: ${fonduriFormatate} ETH`;

        } catch (err) {
            console.error("Eroare la initializare pagina date cont eth:", err);
        }
    }
  
})();
