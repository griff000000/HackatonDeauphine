import { web3, addressFromContractId, ONE_ALPH, DUST_AMOUNT, Address } from '@alephium/web3'
import { expectAssertionError, randomContractId, testAddress } from '@alephium/web3-test'
import { Escrow, EscrowTypes, TrustRegistry } from '../../artifacts/ts'

describe('Escrow contract', () => {
  const escrowContractId = randomContractId()
  const escrowAddress = addressFromContractId(escrowContractId)
  const registryContractId = randomContractId()
  const registryAddress = addressFromContractId(registryContractId)

  // Use devnet pre-funded wallet addresses
  const clientAddress = testAddress // 1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH
  const freelancerAddress = '14UAjZ3qcmEVKdTo84Kwf4RprTQi86w2TefnnGFjov9xF' as Address
  const arbiterAddress = '15jjExDyS8q3Wqk9v29PCQ21jDqubDrD8WQdgn6VW2oi4' as Address

  const testAmount = 10n * ONE_ALPH
  const testCollateral = 5n * ONE_ALPH
  const testDeadline = BigInt(Date.now()) + 86400000n // +24h

  function getBaseFields(): EscrowTypes.Fields {
    return {
      client: clientAddress,
      freelancer: freelancerAddress,
      arbiter: arbiterAddress,
      amount: testAmount,
      collateral: testCollateral,
      deadline: testDeadline,
      cdcHash: Buffer.from('QmTestHash', 'utf8').toString('hex'),
      trustRegistry: registryContractId,
      deliverableLink: Buffer.from('', 'utf8').toString('hex'),
      status: 0n
    }
  }

  beforeAll(async () => {
    web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
  })

  // ==================== acceptAndDeposit ====================

  it('acceptAndDeposit: freelancer deposits collateral, status becomes 1', async () => {
    const testResult = await Escrow.tests.acceptAndDeposit({
      contractAddress: escrowAddress,
      initialAsset: { alphAmount: testAmount + ONE_ALPH },
      initialFields: getBaseFields(),
      inputAssets: [{ address: freelancerAddress, asset: { alphAmount: testCollateral + ONE_ALPH } }],
      existingContracts: [TrustRegistry.stateForTest({}, { alphAmount: ONE_ALPH }, registryAddress)]
    })

    const contractState = testResult.contracts.find(c => c.address === escrowAddress) as EscrowTypes.State
    expect(contractState.fields.status).toEqual(1n)

    // Check event
    expect(testResult.events.length).toEqual(1)
    const event = testResult.events[0] as EscrowTypes.FreelancerAcceptedEvent
    expect(event.name).toEqual('FreelancerAccepted')
    expect(event.fields.freelancer).toEqual(freelancerAddress)
    expect(event.fields.collateral).toEqual(testCollateral)
  })

  it('acceptAndDeposit: fails if not freelancer', async () => {
    await expectAssertionError(
      Escrow.tests.acceptAndDeposit({
        contractAddress: escrowAddress,
        initialAsset: { alphAmount: testAmount + ONE_ALPH },
        initialFields: getBaseFields(),
        inputAssets: [{ address: clientAddress, asset: { alphAmount: testCollateral + ONE_ALPH } }],
        existingContracts: [TrustRegistry.stateForTest({}, { alphAmount: ONE_ALPH }, registryAddress)]
      }),
      escrowAddress,
      Escrow.consts.ErrorCodes.OnlyFreelancer
    )
  })

  it('acceptAndDeposit: fails if status is not 0', async () => {
    const fields = { ...getBaseFields(), status: 1n }
    await expectAssertionError(
      Escrow.tests.acceptAndDeposit({
        contractAddress: escrowAddress,
        initialAsset: { alphAmount: testAmount + testCollateral + ONE_ALPH },
        initialFields: fields,
        inputAssets: [{ address: freelancerAddress, asset: { alphAmount: testCollateral + ONE_ALPH } }],
        existingContracts: [TrustRegistry.stateForTest({}, { alphAmount: ONE_ALPH }, registryAddress)]
      }),
      escrowAddress,
      Escrow.consts.ErrorCodes.InvalidStatus
    )
  })

  // ==================== deliver ====================

  it('deliver: freelancer submits work link, status becomes 2', async () => {
    const fields = { ...getBaseFields(), status: 1n }
    const link = Buffer.from('https://github.com/my-work', 'utf8').toString('hex')

    const testResult = await Escrow.tests.deliver({
      contractAddress: escrowAddress,
      initialAsset: { alphAmount: testAmount + testCollateral + ONE_ALPH },
      initialFields: fields,
      args: { link },
      inputAssets: [{ address: freelancerAddress, asset: { alphAmount: ONE_ALPH } }],
      existingContracts: [TrustRegistry.stateForTest({}, { alphAmount: ONE_ALPH }, registryAddress)]
    })

    const contractState = testResult.contracts.find(c => c.address === escrowAddress) as EscrowTypes.State
    expect(contractState.fields.status).toEqual(2n)
    expect(contractState.fields.deliverableLink).toEqual(link)

    const event = testResult.events[0] as EscrowTypes.WorkDeliveredEvent
    expect(event.name).toEqual('WorkDelivered')
    expect(event.fields.link).toEqual(link)
  })

  it('deliver: fails if not freelancer', async () => {
    const fields = { ...getBaseFields(), status: 1n }
    const link = Buffer.from('https://github.com/my-work', 'utf8').toString('hex')

    await expectAssertionError(
      Escrow.tests.deliver({
        contractAddress: escrowAddress,
        initialAsset: { alphAmount: testAmount + testCollateral + ONE_ALPH },
        initialFields: fields,
        args: { link },
        inputAssets: [{ address: clientAddress, asset: { alphAmount: ONE_ALPH } }],
        existingContracts: [TrustRegistry.stateForTest({}, { alphAmount: ONE_ALPH }, registryAddress)]
      }),
      escrowAddress,
      Escrow.consts.ErrorCodes.OnlyFreelancer
    )
  })

  // ==================== release ====================

  it('release: client validates, freelancer receives amount + collateral', async () => {
    const fields = { ...getBaseFields(), status: 2n }
    const totalInContract = testAmount + testCollateral

    const testResult = await Escrow.tests.release({
      contractAddress: escrowAddress,
      initialAsset: { alphAmount: totalInContract + ONE_ALPH },
      initialFields: fields,
      inputAssets: [{ address: clientAddress, asset: { alphAmount: ONE_ALPH } }],
      existingContracts: [TrustRegistry.stateForTest({}, { alphAmount: ONE_ALPH }, registryAddress)]
    })

    // Escrow contract should be destroyed
    const escrowStillExists = testResult.contracts.some(c => c.address === escrowAddress)
    expect(escrowStillExists).toBe(false)

    // Check freelancer received funds
    const freelancerOutputs = testResult.txOutputs.filter(
      o => o.address === freelancerAddress && o.type === 'AssetOutput'
    )
    const totalReceived = freelancerOutputs.reduce((sum, o) => sum + BigInt(o.alphAmount), 0n)
    expect(totalReceived).toBeGreaterThanOrEqual(totalInContract)

    // Check event
    const event = testResult.events.find(e => e.name === 'PaymentReleased') as EscrowTypes.PaymentReleasedEvent
    expect(event.fields.to).toEqual(freelancerAddress)
    expect(event.fields.totalAmount).toEqual(totalInContract)
  })

  it('release: fails if not client', async () => {
    const fields = { ...getBaseFields(), status: 2n }

    await expectAssertionError(
      Escrow.tests.release({
        contractAddress: escrowAddress,
        initialAsset: { alphAmount: testAmount + testCollateral + ONE_ALPH },
        initialFields: fields,
        inputAssets: [{ address: freelancerAddress, asset: { alphAmount: ONE_ALPH } }],
        existingContracts: [TrustRegistry.stateForTest({}, { alphAmount: ONE_ALPH }, registryAddress)]
      }),
      escrowAddress,
      Escrow.consts.ErrorCodes.OnlyClient
    )
  })

  // ==================== dispute ====================

  it('dispute: client opens dispute, status becomes 3', async () => {
    const fields = { ...getBaseFields(), status: 2n }

    const testResult = await Escrow.tests.dispute({
      contractAddress: escrowAddress,
      initialAsset: { alphAmount: testAmount + testCollateral + ONE_ALPH },
      initialFields: fields,
      inputAssets: [{ address: clientAddress, asset: { alphAmount: ONE_ALPH } }],
      existingContracts: [TrustRegistry.stateForTest({}, { alphAmount: ONE_ALPH }, registryAddress)]
    })

    const contractState = testResult.contracts.find(c => c.address === escrowAddress) as EscrowTypes.State
    expect(contractState.fields.status).toEqual(3n)

    const event = testResult.events[0] as EscrowTypes.DisputeOpenedEvent
    expect(event.name).toEqual('DisputeOpened')
    expect(event.fields.opener).toEqual(clientAddress)
  })

  it('dispute: freelancer can also open dispute', async () => {
    const fields = { ...getBaseFields(), status: 1n }

    const testResult = await Escrow.tests.dispute({
      contractAddress: escrowAddress,
      initialAsset: { alphAmount: testAmount + testCollateral + ONE_ALPH },
      initialFields: fields,
      inputAssets: [{ address: freelancerAddress, asset: { alphAmount: ONE_ALPH } }],
      existingContracts: [TrustRegistry.stateForTest({}, { alphAmount: ONE_ALPH }, registryAddress)]
    })

    const contractState = testResult.contracts.find(c => c.address === escrowAddress) as EscrowTypes.State
    expect(contractState.fields.status).toEqual(3n)
  })

  it('dispute: fails if arbiter tries to dispute', async () => {
    const fields = { ...getBaseFields(), status: 2n }

    await expectAssertionError(
      Escrow.tests.dispute({
        contractAddress: escrowAddress,
        initialAsset: { alphAmount: testAmount + testCollateral + ONE_ALPH },
        initialFields: fields,
        inputAssets: [{ address: arbiterAddress, asset: { alphAmount: ONE_ALPH } }],
        existingContracts: [TrustRegistry.stateForTest({}, { alphAmount: ONE_ALPH }, registryAddress)]
      }),
      escrowAddress,
      Escrow.consts.ErrorCodes.OnlyClientOrFreelancer
    )
  })

  // ==================== resolve ====================

  it('resolve(true): arbiter rules for freelancer', async () => {
    const fields = { ...getBaseFields(), status: 3n }
    const totalInContract = testAmount + testCollateral

    const testResult = await Escrow.tests.resolve({
      contractAddress: escrowAddress,
      initialAsset: { alphAmount: totalInContract + ONE_ALPH },
      initialFields: fields,
      args: { toFreelancer: true },
      inputAssets: [{ address: arbiterAddress, asset: { alphAmount: ONE_ALPH } }],
      existingContracts: [TrustRegistry.stateForTest({}, { alphAmount: ONE_ALPH }, registryAddress)]
    })

    // Contract destroyed
    const escrowStillExists = testResult.contracts.some(c => c.address === escrowAddress)
    expect(escrowStillExists).toBe(false)

    // Check event
    const event = testResult.events.find(e => e.name === 'DisputeResolved') as EscrowTypes.DisputeResolvedEvent
    expect(event.fields.toFreelancer).toBe(true)
  })

  it('resolve(false): arbiter rules for client', async () => {
    const fields = { ...getBaseFields(), status: 3n }
    const totalInContract = testAmount + testCollateral

    const testResult = await Escrow.tests.resolve({
      contractAddress: escrowAddress,
      initialAsset: { alphAmount: totalInContract + ONE_ALPH },
      initialFields: fields,
      args: { toFreelancer: false },
      inputAssets: [{ address: arbiterAddress, asset: { alphAmount: ONE_ALPH } }],
      existingContracts: [TrustRegistry.stateForTest({}, { alphAmount: ONE_ALPH }, registryAddress)]
    })

    const escrowStillExists = testResult.contracts.some(c => c.address === escrowAddress)
    expect(escrowStillExists).toBe(false)

    const event = testResult.events.find(e => e.name === 'DisputeResolved') as EscrowTypes.DisputeResolvedEvent
    expect(event.fields.toFreelancer).toBe(false)
  })

  it('resolve: fails if not arbiter', async () => {
    const fields = { ...getBaseFields(), status: 3n }

    await expectAssertionError(
      Escrow.tests.resolve({
        contractAddress: escrowAddress,
        initialAsset: { alphAmount: testAmount + testCollateral + ONE_ALPH },
        initialFields: fields,
        args: { toFreelancer: true },
        inputAssets: [{ address: clientAddress, asset: { alphAmount: ONE_ALPH } }],
        existingContracts: [TrustRegistry.stateForTest({}, { alphAmount: ONE_ALPH }, registryAddress)]
      }),
      escrowAddress,
      Escrow.consts.ErrorCodes.OnlyArbiter
    )
  })

  // ==================== cancelByClient ====================

  it('cancelByClient: client cancels before freelancer accepts', async () => {
    const testResult = await Escrow.tests.cancelByClient({
      contractAddress: escrowAddress,
      initialAsset: { alphAmount: testAmount + ONE_ALPH },
      initialFields: getBaseFields(),
      inputAssets: [{ address: clientAddress, asset: { alphAmount: ONE_ALPH } }],
      existingContracts: [TrustRegistry.stateForTest({}, { alphAmount: ONE_ALPH }, registryAddress)]
    })

    // Contract destroyed
    const escrowStillExists = testResult.contracts.some(c => c.address === escrowAddress)
    expect(escrowStillExists).toBe(false)

    // Client should get amount back
    const clientOutputs = testResult.txOutputs.filter(
      o => o.address === clientAddress && o.type === 'AssetOutput'
    )
    const totalReceived = clientOutputs.reduce((sum, o) => sum + BigInt(o.alphAmount), 0n)
    expect(totalReceived).toBeGreaterThanOrEqual(testAmount)

    const event = testResult.events.find(e => e.name === 'EscrowCancelled') as EscrowTypes.EscrowCancelledEvent
    expect(event).toBeDefined()
  })

  it('cancelByClient: fails if status is not 0', async () => {
    const fields = { ...getBaseFields(), status: 1n }

    await expectAssertionError(
      Escrow.tests.cancelByClient({
        contractAddress: escrowAddress,
        initialAsset: { alphAmount: testAmount + testCollateral + ONE_ALPH },
        initialFields: fields,
        inputAssets: [{ address: clientAddress, asset: { alphAmount: ONE_ALPH } }],
        existingContracts: [TrustRegistry.stateForTest({}, { alphAmount: ONE_ALPH }, registryAddress)]
      }),
      escrowAddress,
      Escrow.consts.ErrorCodes.InvalidStatus
    )
  })

  // ==================== refundByFreelancer ====================

  it('refundByFreelancer: freelancer refunds client, both get their funds back', async () => {
    const fields = { ...getBaseFields(), status: 1n }
    const totalInContract = testAmount + testCollateral

    const testResult = await Escrow.tests.refundByFreelancer({
      contractAddress: escrowAddress,
      initialAsset: { alphAmount: totalInContract + ONE_ALPH },
      initialFields: fields,
      inputAssets: [{ address: freelancerAddress, asset: { alphAmount: ONE_ALPH } }],
      existingContracts: [TrustRegistry.stateForTest({}, { alphAmount: ONE_ALPH }, registryAddress)]
    })

    // Contract destroyed
    const escrowStillExists = testResult.contracts.some(c => c.address === escrowAddress)
    expect(escrowStillExists).toBe(false)

    // Client should get amount back
    const clientOutputs = testResult.txOutputs.filter(
      o => o.address === clientAddress && o.type === 'AssetOutput'
    )
    const clientReceived = clientOutputs.reduce((sum, o) => sum + BigInt(o.alphAmount), 0n)
    expect(clientReceived).toBeGreaterThanOrEqual(testAmount)

    // Freelancer should get collateral back
    const freelancerOutputs = testResult.txOutputs.filter(
      o => o.address === freelancerAddress && o.type === 'AssetOutput'
    )
    const freelancerReceived = freelancerOutputs.reduce((sum, o) => sum + BigInt(o.alphAmount), 0n)
    expect(freelancerReceived).toBeGreaterThanOrEqual(testCollateral)

    // Check event
    const event = testResult.events.find(e => e.name === 'FreelancerRefunded') as EscrowTypes.FreelancerRefundedEvent
    expect(event).toBeDefined()
    expect(event.fields.freelancer).toEqual(freelancerAddress)
  })

  it('refundByFreelancer: fails if not freelancer', async () => {
    const fields = { ...getBaseFields(), status: 1n }

    await expectAssertionError(
      Escrow.tests.refundByFreelancer({
        contractAddress: escrowAddress,
        initialAsset: { alphAmount: testAmount + testCollateral + ONE_ALPH },
        initialFields: fields,
        inputAssets: [{ address: clientAddress, asset: { alphAmount: ONE_ALPH } }],
        existingContracts: [TrustRegistry.stateForTest({}, { alphAmount: ONE_ALPH }, registryAddress)]
      }),
      escrowAddress,
      Escrow.consts.ErrorCodes.OnlyFreelancer
    )
  })

  it('refundByFreelancer: fails if status is not 1 (Active)', async () => {
    const fields = { ...getBaseFields(), status: 2n }

    await expectAssertionError(
      Escrow.tests.refundByFreelancer({
        contractAddress: escrowAddress,
        initialAsset: { alphAmount: testAmount + testCollateral + ONE_ALPH },
        initialFields: fields,
        inputAssets: [{ address: freelancerAddress, asset: { alphAmount: ONE_ALPH } }],
        existingContracts: [TrustRegistry.stateForTest({}, { alphAmount: ONE_ALPH }, registryAddress)]
      }),
      escrowAddress,
      Escrow.consts.ErrorCodes.InvalidStatus
    )
  })

  // ==================== autoClaim ====================

  it('autoClaim: freelancer claims after deadline + 48h', async () => {
    const pastDeadline = BigInt(Date.now()) - 200000000n // well in the past
    const fields = { ...getBaseFields(), status: 2n, deadline: pastDeadline }
    const totalInContract = testAmount + testCollateral

    const testResult = await Escrow.tests.autoClaim({
      contractAddress: escrowAddress,
      initialAsset: { alphAmount: totalInContract + ONE_ALPH },
      initialFields: fields,
      inputAssets: [{ address: freelancerAddress, asset: { alphAmount: ONE_ALPH } }],
      existingContracts: [TrustRegistry.stateForTest({}, { alphAmount: ONE_ALPH }, registryAddress)]
    })

    const escrowStillExists = testResult.contracts.some(c => c.address === escrowAddress)
    expect(escrowStillExists).toBe(false)

    const event = testResult.events.find(e => e.name === 'PaymentReleased') as EscrowTypes.PaymentReleasedEvent
    expect(event.fields.to).toEqual(freelancerAddress)
  })

  it('autoClaim: fails if deadline + 48h not reached', async () => {
    const futureDeadline = BigInt(Date.now()) + 86400000n // still in the future
    const fields = { ...getBaseFields(), status: 2n, deadline: futureDeadline }

    await expectAssertionError(
      Escrow.tests.autoClaim({
        contractAddress: escrowAddress,
        initialAsset: { alphAmount: testAmount + testCollateral + ONE_ALPH },
        initialFields: fields,
        inputAssets: [{ address: freelancerAddress, asset: { alphAmount: ONE_ALPH } }],
        existingContracts: [TrustRegistry.stateForTest({}, { alphAmount: ONE_ALPH }, registryAddress)]
      }),
      escrowAddress,
      Escrow.consts.ErrorCodes.AutoClaimTooEarly
    )
  })
})

describe('TrustRegistry contract', () => {
  const registryContractId = randomContractId()
  const registryAddress = addressFromContractId(registryContractId)
  const freelancerAddress = '14UAjZ3qcmEVKdTo84Kwf4RprTQi86w2TefnnGFjov9xF' as Address

  beforeAll(async () => {
    web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
  })

  it('getScore: returns 50 for new freelancer', async () => {
    const testResult = await TrustRegistry.tests.getScore({
      contractAddress: registryAddress,
      initialAsset: { alphAmount: ONE_ALPH },
      args: { freelancer: freelancerAddress },
      inputAssets: [{ address: testAddress, asset: { alphAmount: ONE_ALPH } }]
    })

    expect(testResult.returns).toEqual(50n)
  })

  it('getScore: returns stored score for existing freelancer', async () => {
    const testResult = await TrustRegistry.tests.getScore({
      contractAddress: registryAddress,
      initialAsset: { alphAmount: ONE_ALPH },
      args: { freelancer: freelancerAddress },
      inputAssets: [{ address: testAddress, asset: { alphAmount: ONE_ALPH } }],
      initialMaps: { scores: new Map([[freelancerAddress, 80n]]) }
    })

    expect(testResult.returns).toEqual(80n)
  })

  it('calculateCollateral: new freelancer (score 50) pays 50%', async () => {
    const baseCollateral = 10n * ONE_ALPH
    const testResult = await TrustRegistry.tests.calculateCollateral({
      contractAddress: registryAddress,
      initialAsset: { alphAmount: ONE_ALPH },
      args: { baseCollateral, freelancer: freelancerAddress },
      inputAssets: [{ address: testAddress, asset: { alphAmount: ONE_ALPH } }]
    })

    expect(testResult.returns).toEqual(5n * ONE_ALPH) // 50% of 10 ALPH
  })

  it('calculateCollateral: good freelancer (score 90) pays 10% minimum', async () => {
    const baseCollateral = 10n * ONE_ALPH
    const testResult = await TrustRegistry.tests.calculateCollateral({
      contractAddress: registryAddress,
      initialAsset: { alphAmount: ONE_ALPH },
      args: { baseCollateral, freelancer: freelancerAddress },
      inputAssets: [{ address: testAddress, asset: { alphAmount: ONE_ALPH } }],
      initialMaps: { scores: new Map([[freelancerAddress, 95n]]) }
    })

    expect(testResult.returns).toEqual(1n * ONE_ALPH) // 10% minimum
  })

  it('calculateCollateral: bad freelancer (score 20) pays 80%', async () => {
    const baseCollateral = 10n * ONE_ALPH
    const testResult = await TrustRegistry.tests.calculateCollateral({
      contractAddress: registryAddress,
      initialAsset: { alphAmount: ONE_ALPH },
      args: { baseCollateral, freelancer: freelancerAddress },
      inputAssets: [{ address: testAddress, asset: { alphAmount: ONE_ALPH } }],
      initialMaps: { scores: new Map([[freelancerAddress, 20n]]) }
    })

    expect(testResult.returns).toEqual(8n * ONE_ALPH) // 80%
  })

  it('increaseScore: caps at 100', async () => {
    const testResult = await TrustRegistry.tests.increaseScore({
      contractAddress: registryAddress,
      initialAsset: { alphAmount: ONE_ALPH },
      args: { freelancer: freelancerAddress, amount: 10n },
      inputAssets: [{ address: testAddress, asset: { alphAmount: ONE_ALPH } }],
      initialMaps: { scores: new Map([[freelancerAddress, 95n]]) }
    })

    const event = testResult.events[0]
    expect(event.name).toEqual('ScoreUpdated')
    expect((event.fields as any).newScore).toEqual(100n)
  })

  it('decreaseScore: floors at 0', async () => {
    const testResult = await TrustRegistry.tests.decreaseScore({
      contractAddress: registryAddress,
      initialAsset: { alphAmount: ONE_ALPH },
      args: { freelancer: freelancerAddress, amount: 20n },
      inputAssets: [{ address: testAddress, asset: { alphAmount: ONE_ALPH } }],
      initialMaps: { scores: new Map([[freelancerAddress, 10n]]) }
    })

    const event = testResult.events[0]
    expect(event.name).toEqual('ScoreUpdated')
    expect((event.fields as any).newScore).toEqual(0n)
  })
})
