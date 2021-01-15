import axios from 'axios';
import BigNumber from 'bignumber.js';
import { BN } from 'ethereumjs-util';
const HOST_URL = 'https://mainnet.mewwallet.dev/v2';
const GET_LIST = '/swap/list';
const GET_QUOTE = '/swap/quote';
const GET_TRADE = '/swap/trade';
class Dex {
  constructor(web3) {
    this.web3 = web3;
  }
  getSupportedTokens() {
    return axios.get(`${HOST_URL}${GET_LIST}`).then(response => {
      const data = response.data;
      return data.map(d => {
        return {
          contract_address: d.contract_address,
          decimals: parseInt(d.decimals),
          icon: d.icon,
          icon_png: d.icon_png,
          name: d.name,
          symbol: d.symbol
        };
      });
    });
  }
  getQuote({ fromT, toT, fromAmount }) {
    const fromAmountBN = new BigNumber(fromAmount);
    const queryAmount = fromAmountBN.div(
      new BN(10).pow(new BigNumber(fromT.decimals))
    );
    return axios
      .get(`${HOST_URL}${GET_QUOTE}`, {
        params: {
          fromContractAddress: fromT.contract_address,
          toContractAddress: toT.contract_address,
          amount: queryAmount.toFixed(fromT.decimals)
        }
      })
      .then(response => {
        const quotes = response.data.quotes;
        return quotes.map(q => {
          return {
            dex: q.exchange,
            service: q.dex,
            amount: q.amount
          };
        });
      });
  }
  trade({ toAddress, service, dex, fromT, toT, fromAmount }) {
    const fromAmountBN = new BigNumber(fromAmount);
    const queryAmount = fromAmountBN.div(
      new BN(10).pow(new BigNumber(fromT.decimals))
    );
    return axios
      .get(`${HOST_URL}${GET_TRADE}`, {
        params: {
          address: toAddress,
          dex: service,
          exchange: dex,
          platform: 'web',
          fromContractAddress: fromT.contract_address,
          toContractAddress: toT.contract_address,
          amount: queryAmount.toFixed(fromT.decimals)
        }
      })
      .then(() => {
        //const transactions = response.data.transactions;
        //return this.web3.eth.batchTX;
        //return statusCheck Object
        //return {hashes:[]}
      });
  }
  getStatus(statusObj) {
    let isSuccess = true;
    let isPending = false;
    const hashes = statusObj.hashes;
    const promises = [];
    hashes.forEach(h => {
      promises.push(
        this.web3.eth.getTransactionReceipt(h).then(receipt => {
          if (!receipt.blockNumber) {
            isPending = true;
            return;
          }
          if (!receipt.status) {
            isSuccess = false;
          }
        })
      );
    });
    return Promise.all(promises).then(() => {
      if (isPending)
        return {
          isPending,
          isSuccess: false
        };
      return {
        isPending,
        isSuccess
      };
    });
  }
}
export default Dex;
