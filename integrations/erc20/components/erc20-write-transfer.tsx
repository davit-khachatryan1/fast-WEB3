import { useForm } from "react-hook-form"
import { useDebounce } from "usehooks-ts"
import { BaseError, parseEther } from "viem"
import { Address, useWaitForTransaction } from "wagmi"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ContractWriteButton } from "@/components/blockchain/contract-write-button"
import { TransactionStatus } from "@/components/blockchain/transaction-status"
import { WalletConnect } from "@/components/blockchain/wallet-connect"
import { IsWalletConnected } from "@/components/shared/is-wallet-connected"
import { IsWalletDisconnected } from "@/components/shared/is-wallet-disconnected"

import {
  useErc20Transfer,
  usePrepareErc20Transfer,
} from "../generated/erc20-wagmi"
import ERC20EventTransfer from "./erc20-event-transfer"

interface ERC20WriteTransferProps {
  address: Address
}

export function ERC20ContractTransferTokens({
  address,
}: ERC20WriteTransferProps) {
  const { register, watch, handleSubmit } = useForm()

  const watchAmount: string = watch("amount")
  const watchTo = watch("to")
  const debouncedAmount = useDebounce(watchAmount, 500)
  const debouncedTo = useDebounce(watchTo, 500)

  const isValidAmount = Boolean(
    debouncedAmount && !isNaN(Number(debouncedAmount))
  )

  const { config, error, isError } = usePrepareErc20Transfer({
    address,
    args:
      debouncedTo && isValidAmount
        ? [debouncedTo, parseEther(`${Number(debouncedAmount)}`)]
        : undefined,
    enabled: Boolean(debouncedTo && isValidAmount),
  })

  const { data, write, isLoading: isLoadingWrite } = useErc20Transfer(config)

  const { isLoading: isLoadingTx, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  const onSubmit = () => {
    write?.()
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <label>Amount</label>
      <input placeholder="10" {...register("amount")} className="input" />
      <label>To</label>
      <input placeholder="hi.eth" {...register("to")} className="input" />
      <ContractWriteButton
        isLoadingTx={isLoadingTx}
        isLoadingWrite={isLoadingWrite}
        loadingTxText="Transferring..."
        type="submit"
        write={!!write}
      >
        Transfer
      </ContractWriteButton>
      <TransactionStatus
        error={error as BaseError}
        hash={data?.hash}
        isError={isError}
        isLoadingTx={isLoadingTx}
        isSuccess={isSuccess}
      />
    </form>
  )
}

export function ERC20WriteTransfer({ address }: ERC20WriteTransferProps) {
  return (
    <>
      <IsWalletConnected>
        <Card>
          <CardContent>
            <ERC20ContractTransferTokens address={address} />
            <ERC20EventTransfer />
          </CardContent>
          <Separator className="my-4" />
          <CardFooter className="justify-between">
            <h3 className="text-center">ERC20 Transfer</h3>
            <p className="text-center text-sm text-muted-foreground">
              Transer tokens to a friend... or enemy.
            </p>
          </CardFooter>
        </Card>
      </IsWalletConnected>
      <IsWalletDisconnected>
        <div className="flex items-center justify-center gap-10">
          <WalletConnect />
        </div>
      </IsWalletDisconnected>
    </>
  )
}
