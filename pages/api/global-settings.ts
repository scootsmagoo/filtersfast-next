import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  error: string;
};

export default function handler(_req: NextApiRequest, res: NextApiResponse<Data>) {
  res
    .status(410)
    .json({
      error:
        'This endpoint has been retired. Please use the authenticated /api/admin/settings route.',
    });
}


