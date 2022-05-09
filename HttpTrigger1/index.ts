import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { sign } from "tweetnacl";

function has<T, K extends string>(
  x: T,
  k: K
): x is T & object & Record<K, unknown> {
  return x !== null && typeof x === "object" && k in x;
}

function tof(x: unknown, t: string) {
  return x !== null && typeof x === t;
}

function arr<T>(x: T): x is T & unknown[] {
  return x !== null && x instanceof Array;
}

const bad_req = {
  status: 400,
  body: "bad request",
};

const weekdays_options = [
  {
    label: "Lundi",
    value: "monday",
    emoji: {
      name: "regional_indicator_l",
      id: "973219092439920703",
    },
  },
  {
    label: "Mardi",
    value: "tuesday",
    emoji: {
      name: "regional_indicator_a",
      id: "973219739058978856",
    },
  },
  {
    label: "Mercredi",
    value: "wednesday",
    emoji: {
      name: "regional_indicator_e",
      id: "973219744901627975",
    },
  },
  {
    label: "Jeudi",
    value: "thursday",
    emoji: {
      name: "regional_indicator_j",
      id: "973219767248908328",
    },
  },
  {
    label: "Vendredi",
    value: "friday",
    emoji: {
      name: "regional_indicator_v",
      id: "973219776694456340",
    },
  },
  {
    label: "Samedi",
    value: "saturday",
    emoji: {
      name: "regional_indicator_s",
      id: "973219785657679902",
    },
  },
  {
    label: "Dimanche",
    value: "sunday",
    emoji: {
      name: "regional_indicator_d",
      id: "973219799305949234",
    },
  },
];
const weekdays_names = weekdays_options.map((v) => v.label);

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
  const body: unknown = req.body;
  if (!has(body, "type")) {
    context.res = bad_req;
    return;
  }
  if (body.type === 1) {
    context.res = {
      body: { type: 1 },
    };
    return;
  }
  if (
    !has(body, "data") ||
    !has(body.data, "options") ||
    !arr(body.data.options)
  ) {
    context.res = bad_req;
    return;
  }
  let [title, role]: string | null[] = [null, null];
  for (const option of body.data.options) {
    if (
      !has(option, "name") ||
      !has(option, "value") ||
      typeof option.value !== "string"
    ) {
      context.res = bad_req;
      return;
    }
    if (option.name === "title") {
      title = option.value;
    } else if (option.name === "role") {
      role = option.value;
    }
    if (title && role) {
      break;
    }
  }
  if (title === null) {
    context.res = bad_req;
    return;
  }
  if (role !== null) {
    title = `${title} (${role})`;
  }
  console.log("got here");
  context.res = {
    body: {
      type: 4,
      data: {
        embeds: [
          {
            title,
            fields: [
              {
                title: "Préférable",
                value: "N/A",
              },
              {
                title: "Possible",
                value: "N/A",
              },
              {
                title: "Impossible",
                value: "N/A",
              },
            ],
          },
        ],
        components: [
          {
            type: 1,
            components: [
              {
                type: 3,
                custom_id: "weekdays",
                options: weekdays_options,
                placeholder: "Jour(s)",
                max_values: 7,
              },
              {
                type: 2,
                custom_id: "preferred",
                label: "Préféré",
                style: 3,
                emoji: {
                  name: "crown",
                  id: "973221546611077130",
                },
              },
              {
                type: 2,
                custom_id: "unavailable",
                label: "Impossible",
                style: 4,
                emoji: {
                  name: "no_entry_sign",
                  id: "973221668627566602",
                },
              },
            ],
          },
        ],
        allowed_mentions: { roles: [role] },
      },
    },
  };
};

export default httpTrigger;
