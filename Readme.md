# 10 min mail concept with Cloudflare Workers

Creating a concept of a 10 min mail service with Cloudflare Workers. The service will create temp emails to a designated domain you own `random@yourdomain.com`, it will only accept emails from the current `random` email and will send them to Worker's KV store. 

The service will also have a web interface to view the emails. It does also forward the emails to whatever forwarding address you have set up.

Will setup a cron job to clear out the KV store every 24 hours.


## TODOs
- [] Add a cron job to clear out the KV store every 24 hours
- [] Add a web interface to view the emails (expose an api route where you can call to get the emails)
- [] Store more than 1 email in the KV store?
- [] Only store the <html> in the KV store, storing a lot of junk at the moment
- [] Fix the upstream forwarding error
- [] Test with longer email, think about forward the `ReadableStream` to a longer running lamba function on next/vercel to extra the email and save on upstash? (or kv store too)