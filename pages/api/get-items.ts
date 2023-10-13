import type { NextApiRequest, NextApiResponse } from 'next'
import { Client } from '@notionhq/client'

const notion = new Client({
  auth: 'secret_rGha74LtFRqOvlnKDc5DWfwZcjrVSKuJDFm2Z6PWd9A',
})

const databaseId = 'f0dc03d4a9c54c3fb4331d37a0931a75'

async function getItems() {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [
        {
          property: 'price',
          direction: 'ascending',
        },
      ],
    })
    console.log(response)
    return response
  } catch (error) {
    console.error(JSON.stringify(error))
  }
}

type Data = {
  items?: any
  message: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    const response = await getItems()
    res.status(200).json({ items: response?.results, message: 'Success' })
  } catch (error) {
    res.status(400).json({ message: 'Failed' })
  }
}