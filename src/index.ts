import fetch from "cross-fetch";
const unixNow = () => new Date().valueOf() / 1000;

type EventTemplate = {
  created_at: number;
  kind: number;
  content: string;
  tags: string[][];
};
type SignedEvent = EventTemplate & { id: string; sig: string };

const ROOT_URL = "https://api.satellite.earth/v1/media";
type Signer = (draft: EventTemplate) => Promise<SignedEvent>;

export type SatelliteCDNUpload = {
  created: number;
  sha256: string;
  name: string;
  url: string;
  infohash: string;
  magnet: string;
  size: number;
  type: string;
  nip94: string[][];
};
export type SatelliteCDNFile = {
  created: number;
  magnet: string;
  type: string;
  name: string;
  sha256: string;
  size: number;
  url: string;
};
export type SatelliteCDNAccount = {
  timeRemaining: number;
  paidThrough: number;
  transactions: {
    order: SignedEvent;
    receipt: SignedEvent;
    payment: SignedEvent;
  }[];
  storageTotal: number;
  creditTotal: number;
  usageTotal: number;
  rateFiat: {
    usd: number;
  };
  exchangeFiat: {
    usd: number;
  };
  files: SatelliteCDNFile[];
};

export function getAccountAuthToken(signEvent: Signer) {
  return signEvent({
    created_at: unixNow(),
    kind: 22242,
    content: "Authenticate User",
    tags: [],
  });
}

export async function getAccount(authToken: SignedEvent) {
  return fetch(
    `${ROOT_URL}/account?auth=${encodeURIComponent(JSON.stringify(authToken))}`,
  ).then((res) => res.json()) as Promise<SatelliteCDNAccount>;
}

export async function deleteFile(sha256: string, signEvent: Signer) {
  const draft: EventTemplate = {
    created_at: unixNow(),
    kind: 22242,
    content: "Delete Item",
    tags: [["x", sha256]],
  };
  const signed = await signEvent(draft);
  await fetch(
    `${ROOT_URL}/item?auth=${encodeURIComponent(JSON.stringify(signed))}`,
    { method: "DELETE" },
  );
}

export async function uploadFile(file: File, signEvent: Signer) {
  const draft: EventTemplate = {
    created_at: unixNow(),
    kind: 22242,
    content: "Authorize Upload",
    tags: [["name", file.name]],
  };
  const signed = await signEvent(draft);
  return (await fetch(
    `${ROOT_URL}/item?auth=${encodeURIComponent(JSON.stringify(signed))}`,
    {
      method: "PUT",
      body: file,
    },
  ).then((res) => res.json())) as Promise<SatelliteCDNUpload>;
}
