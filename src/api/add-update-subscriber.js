import { unionWith, eqBy, path } from 'ramda'
import moment from 'moment'
import { getList, isExistingUser } from './'

const addUpdateSubscriber = async ({
  spark,
  lang,
  email,
  listId,
  id,
  confirmed,
}) => {
  try {
    const { results: list } = await getList({ spark, listId })

    const { user } = isExistingUser({ id, email, list })
    if (user && !confirmed) {
      return {
        code: 409,
        msg: `NOT_CONFIRMED`,
      }
    }

    if (!user && confirmed) {
      return {
        code: 409,
        msg: `NON_EXISTENT_EMAIL`,
      }
    }

    const newRecipientList = {
      recipients: unionWith(eqBy(path([`address`, `email`])), list.recipients, [
        {
          address: {
            email: user ? user.address.email : email,
          },
          metadata: {
            lang,
            id,
            confirmed,
            date: moment.utc().format(),
          },
          return_path: `newsletter@mail.gaiama.org`,
        },
      ]),
    }

    await spark.recipientLists.update(listId, newRecipientList)

    return { code: 200 }
  } catch (error) {
    return { code: 500, msg: error }
  }
}

export default addUpdateSubscriber