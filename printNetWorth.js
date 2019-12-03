const Gdax = require('coinbase-pro');
const BASE_CURRENCY = 'USD';

/** @const {key:string, secret:string, pass:string} */
const credentials = require('./gdaxConfig.json');
const Promise = require('bluebird');

const productsPromise = new Promise((resolve, reject) => {
    const publicClient = new Gdax.PublicClient();
    publicClient.getProducts((err, response, data) => {
        if (err || response.statusCode > 300) {
            console.error(response.body);
            reject(response.body);
        } else {
            resolve(data);
        }
    });
});

/**
 * @param {string} product 
 * @return {Promise<{product: string, price: number}>}
 */
function pricePromiseFactory(product, backoff = 1) {
    if (backoff > 1000) {
        console.log(`delayed by ${backoff} ms`);
    }
    backoff *= 2
    return new Promise((resolve, reject) => {
        const publicClient = new Gdax.PublicClient();
        publicClient.getProductTicker(product, (err, response, data) => {
            if (err || response.statusCode > 300) {
                reject(err);
            } else if (data) {
                resolve({
                    product: product,
                    price: data.price
                });
            }
        });
    }).catch(() => Promise.delay(backoff).then(() => pricePromiseFactory(product, backoff)));
}

const accountHoldingsPromise = new Promise((resolve, reject) => {
    const authedClient = new Gdax.AuthenticatedClient(credentials.key, credentials.secret, credentials.pass);
    authedClient.getAccounts((err, response, data) => {
        if (err || response.statusCode > 300) {
            console.error(response.body);
            reject(response.body);
        } else {
            resolve(data);
        }
    });
});


/// print net worth by currency
console.log(`\n${new Date().toISOString()}\n Trezor + GDAX net worth in ${BASE_CURRENCY}:`);
productsPromise.then(
    (products) => {
        const toFiatProducts = products.filter((product) => {
            return product.quote_currency === BASE_CURRENCY
        })
        const toFiatPromises = toFiatProducts.map((p) => {
            return pricePromiseFactory(p.id)
        });

        // wait for the account and all prices to return
        let allPromises = [accountHoldingsPromise].concat(toFiatPromises);
        Promise.all(allPromises, 1).then((data) => {
            const accountHoldings = data.shift();
            const currencyValues = data;
            // will hold source currency values in base currency
            let holdings = {};
            for (holding of accountHoldings) {
                if (holding.currency === BASE_CURRENCY) {
                    holdings[holding.currency] = Number(holding.balance);
                } else {
                    // get value in base currency of each source currency
                    const matchingCurrency = currencyValues.find((c) => {
                        return (c.product === `${holding.currency}-${BASE_CURRENCY}`);
                    })
                    if (credentials.otherBalances && credentials.otherBalances[holding.currency]) {
                        holding.balance = Number(credentials.otherBalances[holding.currency]) + Number(holding.balance);
                    }
                    if (matchingCurrency) {
                        const value = holding.balance * matchingCurrency.price;
                        holdings[holding.currency] = value;
                    }

                }
            }
            console.log(holdings);
            // sum all currencies
            let total = Object.keys(holdings).reduce((p, c, i) => {
                return p + holdings[c]
            }, 0);
            console.log(`$${Math.round(total)}`);
        });
    });