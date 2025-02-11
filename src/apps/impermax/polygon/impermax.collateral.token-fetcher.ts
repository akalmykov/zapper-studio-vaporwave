import { Inject } from '@nestjs/common';

import { Register } from '~app-toolkit/decorators';
import { PositionFetcher } from '~position/position-fetcher.interface';
import { AppTokenPosition } from '~position/position.interface';
import { Network } from '~types/network.interface';

import { ImpermaxCollateralTokenHelper } from '../helpers/impermax.collateral.token-fetcher-helper';
import { IMPERMAX_DEFINITION } from '../impermax.definition';

const appId = IMPERMAX_DEFINITION.id;
const groupId = IMPERMAX_DEFINITION.groups.collateral.id;
const network = Network.POLYGON_MAINNET;

const address = '0xbb92270716c8c424849f17ccc12f4f24ad4064d6';

@Register.TokenPositionFetcher({ appId, groupId, network, options: { includeInTvl: true } })
export class PolygonImpermaxCollateralTokenFetcher implements PositionFetcher<AppTokenPosition> {
  constructor(
    @Inject(ImpermaxCollateralTokenHelper)
    private readonly impermaxCollateralTokenHelper: ImpermaxCollateralTokenHelper,
  ) {}

  async getPositions() {
    return this.impermaxCollateralTokenHelper.getPositions({
      address,
      network,
      dependencies: [
        { appId: 'quickswap', groupIds: ['pool'], network },
        { appId: 'sushiswap', groupIds: ['pool'], network },
      ],
    });
  }
}
