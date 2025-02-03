const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
    // Initialize an empty object to store deployed contract addresses
    let deployedContracts = {};

    // Check if the 'deployed-contracts.json' file exists
    if (fs.existsSync('deployed-contracts.json')) {
        // If the file exists, read its contents and parse the JSON data
        const data = fs.readFileSync('deployed-contracts.json', 'utf8');
        deployedContracts = JSON.parse(data);

        // Get the factory of the 'AppContract' contract
        AppContract = await ethers.getContractFactory("AppContract");
    }
    else {
        // If the file does not exist, deploy the required contracts

        let dateUtilizatori, dateFotografi, cidData;

        // Deploy the 'DateUtilizatori' contract
        const dateUtilizatoriContractFactory = await ethers.getContractFactory("DateUtilizatori");
        const dateUtilizatoriContract = await dateUtilizatoriContractFactory.deploy(); // Pass constructor params (if any)
        dateUtilizatori = await dateUtilizatoriContract.getAddress();

        // Deploy the 'DateFotografi' contract
        const dateFotografiContractFactory = await ethers.getContractFactory("DateFotografi");
        const dateFotografiContract = await dateFotografiContractFactory.deploy(); // Pass constructor params (if any)
        dateFotografi = await dateFotografiContract.getAddress();

        // Deploy the 'CIDData' contract
        const cidDataContractFactory = await ethers.getContractFactory("CIDData");
        const cidDataContract = await cidDataContractFactory.deploy(); // Pass constructor params (if any)
        cidData = await cidDataContract.getAddress();

        // Store the addresses of the deployed contracts in 'deployedContracts' object
        deployedContracts = {
            dateUtilizatori: dateUtilizatori,
            dateFotografi: dateFotografi,
            cidData: cidData
        };

        // Write the 'deployedContracts' object to 'deployed-contracts.json' file
        fs.writeFileSync('deployed-contracts.json', JSON.stringify(deployedContracts, null, 2));

        console.log("DateUtilizatori, DateFotografi, and CIDData contracts have been deployed and their contract addresses have been saved to deployed-contracts.json");
    }

    // Deploy the 'AppContract' contract with the addresses of 'DateUtilizatori', 'DateFotografi', and 'CIDData' contracts
    const appContractFactory = await ethers.getContractFactory("AppContract");
    const appContract = await appContractFactory.deploy(deployedContracts.dateUtilizatori, deployedContracts.dateFotografi, deployedContracts.cidData);

    // Print the address of the deployed 'AppContract'
    console.log("AppContract has been deployed at", await appContract.getAddress());

    // Set the AppContract address in the other contracts

    await dateUtilizatoriContract.setAppContract(appContract.getAddress());
    await dateFotografiContract.setAppContract(appContract.getAddress());
    await cidDataContract.setAppContract(appContract.getAddress());

    // Wait for the transactions to be mined
    await Promise.all([
    dateUtilizatoriContract.deployTransaction.wait(),
    dateFotografiContract.deployTransaction.wait(),
    cidDataContract.deployTransaction.wait()
    ]);

    console.log("AppContract address has been set in DateUtilizatori, DateFotografi, and CIDData contracts.");

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
