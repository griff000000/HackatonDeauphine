import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { Escrow } from '../artifacts/ts'
import { ALPH_TOKEN_ID, ONE_ALPH, stringToHex } from '@alephium/web3'

const deployEscrow: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  // Get the TrustRegistry deployed in step 0
  const trustRegistry = deployer.getDeployContractResult('TrustRegistry')

  // Deploy a test escrow with 10 ALPH amount, 5 ALPH base collateral
  const testAmount = 10n * ONE_ALPH
  const testCollateral = 5n * ONE_ALPH
  const testDeadline = BigInt(Date.now()) + 86400000n // +24h

  const result = await deployer.deployContract(Escrow, {
    initialFields: {
      client: deployer.account.address,
      freelancer: deployer.account.address, // same address for devnet test
      arbiter: deployer.account.address,    // same address for devnet test
      amount: testAmount,
      collateral: testCollateral,
      deadline: testDeadline,
      cdcHash: stringToHex('QmTestCdcHash'),
      trustRegistry: trustRegistry.contractInstance.contractId,
      deliverableLink: stringToHex(''),
      status: 0n,
      disputeReason: stringToHex(''),
      disputeEvidence: stringToHex(''),
      disputeJustification: stringToHex('')
    },
    initialAttoAlphAmount: testAmount + ONE_ALPH // amount + contract deposit
  })
  console.log('Escrow contract id: ' + result.contractInstance.contractId)
  console.log('Escrow contract address: ' + result.contractInstance.address)
}

export default deployEscrow
