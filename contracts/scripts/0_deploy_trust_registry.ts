import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { TrustRegistry } from '../artifacts/ts'

const deployTrustRegistry: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  const result = await deployer.deployContract(TrustRegistry, {
    initialFields: {}
  })
  console.log('TrustRegistry contract id: ' + result.contractInstance.contractId)
  console.log('TrustRegistry contract address: ' + result.contractInstance.address)
}

export default deployTrustRegistry
