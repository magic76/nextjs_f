import React from 'react';
import { withApp } from '~/store/initContext';
import { Query } from 'react-apollo';
import Link from '~/component/Link';
import graphqlApiUtil from '~/util/graphqlApiUtil';
import util from '~/util/util';

const Index: (props: any) => JSX.Element = (props: any): JSX.Element => {
    const { app }: any = props;
    return (
        <div>
            <Link href="/"><a>go home</a></Link>
            <Query
                    query={GET_GB_HOTMATCH}
                    variables={{ limit: 20 }}
            >{
                ({ data }: any): any => {
                    return util.getValue(data, ['gb', 'list', 'soccer'], []).map((item: any) => {
                        return (
                            <div key={item.matchID}>
                                <div>{item.matchName}</div>
                                <div>{item.gameTime}</div>
                                <div>{item.sportName}</div>
                            </div>
                        );
                    });
                }}
            </Query>
            <h1
                onClick={
                () => {
                    graphqlApiUtil.clientQuery(GET_GB_HOTMATCH).then((data: any) => console.log('gql client query', data));
                    graphqlApiUtil.query(GET_GB_HOTMATCH, {}, { limit: 20 }).then((data: any) => console.log('gql query', data));
                }}
            >
                Hello World {app.i18n('test')}
            </h1>
            <h2>Current lang {app.lang}</h2>
        </div>
    );
};

import gql from 'graphql-tag';
const gbMatchBaseFg: any = gql`
    fragment GbMatchBase on Match {
        sportID
        sportName
        matchID
        matchName
        betID
        isLive
        isOpt
        gameTime
        teamA {
          name
          score
          imgB
          imgM
          imgS
        }
        teamB {
          name
          score
          imgB
          imgM
          imgS
        }
        single {
          teamAOdds
          teamBOdds
          equalOdds
        }
        spread {
          oddsA
          headA
          oddsB
          headB
        }
        overUnder {
          isMoreThan
          isLessThan
          overOdds
          underOdds
          comparator
        }
        outLink
        equalName
        order
        leagueID
    }
`;

/**
 * GB - 熱門賽事模型
 */
const gbHotMatchFg: any = gql`
    fragment GbHotMatch on MatchGroup {
        recommend {
            ...GbMatchBase
        }
        basketball {
            ...GbMatchBase
        }
        soccer {
            ...GbMatchBase
        }
        eSports {
            ...GbMatchBase
        }
    }
    ${gbMatchBaseFg}
`;

/**
 * GB - 熱門賽事
 */
const GET_GB_HOTMATCH: any = gql`
    query getGbHotMatch($limit: Int) {
        gb {
            list(limit: $limit) {
                ...GbHotMatch
            }
        }
    }
    ${gbHotMatchFg}
`;

export default withApp(Index);
