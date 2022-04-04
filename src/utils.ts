'use strict';


import {
    ethers,
    ContractFactory,
    BigNumber,
    Wallet,
} from 'ethers';
const {
    defaultAbiCoder,
    id,
    arrayify,
    keccak256,
} = ethers.utils;
import http from 'http';
const { outputJsonSync } = require('fs-extra');
const { sortBy } = require('lodash');

const getRandomInt = (max: number) => {
    return Math.floor(Math.random() * max);
  };
  

export function bigNumberToNumber(bigNumber: BigNumber){
    return bigNumber.toNumber()
} 

export function getSignedExecuteInput(data: any, wallet: Wallet) {
    return wallet
      .signMessage(arrayify(keccak256(data)))
      .then((signature) =>
        defaultAbiCoder.encode(['bytes', 'bytes'], [data, signature]),
      );
}
export function getSignedMultisigExecuteInput(data: any, wallets: Wallet[]) {
    return Promise.all(
      sortBy(wallets, (wallet: Wallet) => wallet.address.toLowerCase()).map((wallet: Wallet) =>
        wallet.signMessage(arrayify(keccak256(data))),
      ),
    ).then((signatures) =>
      defaultAbiCoder.encode(['bytes', 'bytes[]'], [data, signatures]),
    );
}

export const getRandomID = () => id(getRandomInt(1e10).toString());
export const getLogID = (chain: string, log: any) => {
    return id(chain+":"+log.blockNumber+':'+log.transactionIndex+':'+log.logIndex);
}
export const defaultAccounts = (n: number, seed='') => {
    const balance = 10000000000000000000000000000000000;
    const privateKeys = [];
    let key = keccak256(defaultAbiCoder.encode(['string'], [seed]));
    for(let i=0;i<n;i++) {
        privateKeys.push(key);
        key = keccak256(key);
    }
    return privateKeys.map(secretKey => ({ balance, secretKey }));
};

export const deployContract = async (wallet : Wallet, contractJson: any, args = [], options = {}) => {
    const factory = new ContractFactory(
        contractJson.abi,
        contractJson.bytecode,
        wallet
    );

    const contract =  await factory.deploy(...args, {...options});
    await contract.deployed();
    return contract;
};
export const setJSON = (data:any, name: string) => {
    outputJsonSync(
        name,
        data,
        {
            spaces:2,
            EOL: "\n" 
        }
    );
};
export const  httpGet = (url: string) => {
    return new Promise((resolve, reject) => { 
        http.get(url, (res) => {
            const { statusCode } = res;
            const contentType = res.headers['content-type'];
            let error;
            if (statusCode !== 200) {
                error = new Error('Request Failed.\n' +
                    `Status Code: ${statusCode}`);
            } else if (!/^application\/json/.test(contentType!)) {
                error = new Error('Invalid content-type.\n' +
                    `Expected application/json but received ${contentType}`);
            }
            if (error) {
                res.resume();
                reject(error);
                return;
            }
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    resolve(parsedData);
                } catch (e) {
                    reject(e);
                }
            });
        });
    });
}


