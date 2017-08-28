const Gdax = require('gdax');

/**
 * Buy a given amount of crypto currency, spread as specified in gdaxConfig.json
 */

const BASE_CURRENCY = 'USD';
/** @const {key:string, secret:string, pass:string} */
const credentials = require('./gdaxConfig.json');

// get cli arguments
var argv = require('minimist')(process.argv.slice(2));

const buyAmount = argv[BASE_CURRENCY] || argv[BASE_CURRENCY.toLowerCase()];

/**
 * Fail and print usage info
 */
function quitAndPrintUsage() {
    console.log('   usage: node buyByPercentage.js --usd=1 [--limit=10%]');
    console.log('                                 (buy amount in $), (percent limit below market)');
    process.exit(1);
}

if (!credentials.buyPercentages) {
    console.error('buyPercentage key missing in config');
    quitAndPrintUsage();
}
else if (!buyAmount) {
    console.error('no currency or amount specified')
    quitAndPrintUsage();
}

if (argv.limit) {
    // TODO: support limit orders
}
else {
    // market order
    for (const key of Object.keys(credentials.buyPercentages)) {
        buyCurrencyAtMarket(key, credentials.buyPercentages[key]*buyAmount);
    }
}

/**
 * Post a market order for a currency
 * @param {string} name currency name 
 * @param {} amount 
 */
function buyCurrencyAtMarket(name, amount) {
    var buyParams = {
        'funds': amount, // USD,
        'product_id': `${name}-${BASE_CURRENCY}`,
        'type': 'market',
    };
    const authedClient = new Gdax.AuthenticatedClient(credentials.key, credentials.secret, credentials.pass);
    authedClient.buy(buyParams).then(data => {
        console.log(data);
    }).catch(error => {
        console.error(error);
    });
}
