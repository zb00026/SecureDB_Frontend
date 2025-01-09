import { state } from '.';

const stateActions = {
  toggleNewbieCard: () => {
    state.session.global.showNewbieCard = !state.session.global.showNewbieCard;
  }
};

export default  stateActions