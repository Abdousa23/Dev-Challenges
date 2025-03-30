import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items, itemHeight, height }: any) => (
    <List
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        width="100%"
    >
        {({ index, style }) => (
            <div style={style} className="p-2 border-b">
                <h3 className="font-bold">{items[index].name}</h3>
                <p>${items[index].price}</p>
                <p>{items[index].category}</p>
            </div>
        )}
    </List>
);

export default VirtualizedList;