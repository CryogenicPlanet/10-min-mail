interface EmailMessage<Body = unknown> {
  readonly from: string;
  readonly to: string;
  readonly headers: Headers;
  readonly raw: ReadableStream;
  readonly rawSize: number;
  setReject(reason: String): void;
  forward(rcptTo: string, headers?: Headers): Promise<void>;
}

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  KV_NAME: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket

  // Optional forward email
  FORWARD_EMAIL: string | undefined;

  EMAIL_DOMAIN: string;
}

// A wordlist of 100 words to use for the email
const wordList = [
  "abruptly",
  "absurd",
  "abyss",
  "affix",
  "askew",
  "avenue",
  "awkward",
  "axiom",
  "azure",
  "bagpipes",
  "bandwagon",
  "banjo",
  "bayou",
  "beekeeper",
  "bikini",
  "blitz",
  "blizzard",
  "boggle",
  "bookworm",
  "boxcar",
  "boxful",
  "buckaroo",
  "buffalo",
  "buffoon",
  "buxom",
  "buzzard",
  "buzzing",
  "buzzwords",
  "caliph",
  "cobweb",
  "cockiness",
  "cough",
  "depth",
  "dew",
  "dexterity",
  "dipstick",
  "dizzying",
  "duplex",
  "dwarves",
  "embezzle",
  "equip",
  "espionage",
  "euouae",
  "exodus",
  "faking",
  "fishhook",
];

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      // Random number within the word list
      const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
      const randomWord2 = wordList[Math.floor(Math.random() * wordList.length)];

      const email = `${randomWord}${Math.floor(
        Math.random() * 100
      )}${randomWord2}.mail@${env.EMAIL_DOMAIN}`;

      await env.KV_NAME.put("currentEmail", email);

      return new Response(email);
    } else if (url.pathname === "/verify") {
      const email = url.searchParams.get("email");

      const setEmail = await env.KV_NAME.get("currentEmail");

      return new Response(
        `${email} ${email === setEmail ? "is" : "is not"} valid`
      );
    }
  },

  async email(message: EmailMessage, env: Env, ctx: ExecutionContext) {
    /**
     * Create your code
     */

    // When we get an email, we want to add the email to the KV store

    const email = await env.KV_NAME.get("currentEmail");

    if (!email) {
      return message.setReject("Not accepting emails at this time");
    }

    if (message.to !== email) {
      return message.setReject("Not accepting emails to this address");
    }

    const reader = message.raw.getReader();

    const decoder = new TextDecoder("utf-8");

    let body = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      body += decoder.decode(value);
    }

    console.log({ body });

    const subject = message.headers.get("subject");

    await env.KV_NAME.put("lastMailBody", body);
    await env.KV_NAME.put("lastMailFrom", message.from);
    if (subject) await env.KV_NAME.put("lastMailSubject", subject);

    if (env.FORWARD_EMAIL) {
      return await message.forward(env.FORWARD_EMAIL);
    }

    return message.setReject("Rejected by worker");
  },
};
