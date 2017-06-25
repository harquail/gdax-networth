Simple script that prints the total value of all cryptocurrency holdings in a GDAX account in a base fiat currency.  

It reads [GDAX API keys](https://support.gdax.com/customer/en/portal/articles/2425383-how-can-i-create-an-api-key-for-gdax-) from 'readFromGdaxKey.json' to authenticate.

To print the value in a different currency, change the BASE_CURRENCY constant.

##Example use case

To save net worth history to a log file, one might set up a cron job that runs ```node printNetWorth.js >> accountHistory.txt``` periodically.
 
