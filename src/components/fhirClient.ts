import { ref } from 'vue'
import type Client from 'fhirclient/lib/Client'

const client = ref<Client>()

export function useFhirClient() {
  const setClient = (newClient: Client) => {
    client.value = newClient
  }

  const getClient = () => client.value

  return {
    client,
    setClient,
    getClient
  }
}
