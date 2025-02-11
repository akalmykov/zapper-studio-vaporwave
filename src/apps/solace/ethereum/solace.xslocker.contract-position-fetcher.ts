import { Inject } from '@nestjs/common';

import { IAppToolkit, APP_TOOLKIT } from '~app-toolkit/app-toolkit.interface';
import { Register } from '~app-toolkit/decorators';
import { buildDollarDisplayItem } from '~app-toolkit/helpers/presentation/display-item.present';
import { getImagesFromToken } from '~app-toolkit/helpers/presentation/image.present';
import { ContractType } from '~position/contract.interface';
import { PositionFetcher } from '~position/position-fetcher.interface';
import { ContractPosition } from '~position/position.interface';
import { claimable, supplied } from '~position/position.utils';
import { Network } from '~types/network.interface';

import { SolaceContractFactory } from '../contracts';
import { SOLACE_DEFINITION } from '../solace.definition';

const appId = SOLACE_DEFINITION.id;
const groupId = SOLACE_DEFINITION.groups.xslocker.id;
const network = Network.ETHEREUM_MAINNET;

const SOLACE_ADDRESS = '0x501ace9c35e60f03a2af4d484f49f9b1efde9f40';
const XSLOCKER_ADDRESS = '0x501ace47c5b0c2099c4464f681c3fa2ecd3146c1';

@Register.ContractPositionFetcher({ appId, groupId, network, options: { includeInTvl: true } })
export class EthereumSolaceXslockerContractPositionFetcher implements PositionFetcher<ContractPosition> {
  constructor(
    @Inject(APP_TOOLKIT) private readonly appToolkit: IAppToolkit,
    @Inject(SolaceContractFactory) private readonly solaceContractFactory: SolaceContractFactory,
  ) {}

  async getPositions() {
    const multicall = this.appToolkit.getMulticall(network);
    const baseTokens = await this.appToolkit.getBaseTokenPrices(network);
    const solace = baseTokens.find(t => t.address === SOLACE_ADDRESS)!;
    if (!solace) return [];

    const solaceTokenContract = this.solaceContractFactory.erc20({ address: SOLACE_ADDRESS, network });
    const [balanceOfRaw, decimals] = await Promise.all([
      multicall.wrap(solaceTokenContract).balanceOf(XSLOCKER_ADDRESS),
      multicall.wrap(solaceTokenContract).decimals(),
    ]);

    const balanceOf = Number(balanceOfRaw) / 10 ** decimals;
    const liquidity = balanceOf * solace.price;

    const position: ContractPosition = {
      type: ContractType.POSITION,
      address: XSLOCKER_ADDRESS,
      appId,
      groupId,
      network,
      tokens: [supplied(solace), claimable(solace)],
      dataProps: {
        liquidity,
      },
      displayProps: {
        label: `xsLOCK`,
        images: getImagesFromToken(solace),
        statsItems: [{ label: 'Liquidity', value: buildDollarDisplayItem(liquidity) }],
      },
    };

    return [position];
  }
}
