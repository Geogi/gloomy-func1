import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { sign } from "tweetnacl";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const publicKey =
    "d3b2bd5264e41f88e6853e90d98e506680fd85ef6e4f4f4b800060aa03d1bc51";
  const signature = req.headers["x-signature-ed25519"];
  const timestamp = req.headers["x-signature-timestamp"];
  if (!signature || !timestamp) {
    context.res = {
      status: 401,
      body: "missing signature",
    };
    return;
  }
  const isVerified = sign.detached.verify(
    Buffer.from(timestamp + req.rawBody),
    Buffer.from(signature, "hex"),
    Buffer.from(publicKey, "hex")
  );
  if (!isVerified) {
    context.res = {
      status: 401,
      body: "invalid request signature",
    };
    return;
  }
  if (req.body && req.body.type === 1) {
    context.res = {
      body: { type: 1 },
    };
    return;
  }
  const {
    data: { options: interaction_options },
  } = req.body;
  const event_title = interaction_options.find(({name}) => name === "title").value;
  context.res = {
    type: 4,
    data: {
      embeds: [
        {
          title: "",
        },
      ],
      allowed_mentions: { roles: [] },
    },
  };
};

export default httpTrigger;
