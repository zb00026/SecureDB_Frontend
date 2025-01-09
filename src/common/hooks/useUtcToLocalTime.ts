import moment from 'moment';

export default (date: any, fmt: any = 'YYYY/MM/DD HH:mm:ss'):any => {
  const flagDate = date.substr(0, 10) + 'T' + date.substr(11, 8) + 'Z';
  //   const fmt = 'YYYY/MM/DD HH:mm:00';
  return moment.utc(flagDate).local().format(fmt);
};

