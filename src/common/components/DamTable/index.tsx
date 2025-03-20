import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Box,
  Flex,
  Select,
  Text,
  TableProps as ChakraTableProps,
  IconButton,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from "@chakra-ui/icons";

interface Column {
  title: string;
  dataIndex: string;
  key: string;
  render?: (text: any, record: any) => ReactNode;
  width?: number | string;
}

interface PaginationMeta {
  total: number;
  current_page: number;
  per_page: number;
}

interface PaginationProps {
  meta?: PaginationMeta;
  onChange?: (page: number, pageSize: number) => void;
}

interface DamTableProps extends Omit<ChakraTableProps, "children"> {
  columns: Column[];
  dataSource: any[];
  pagination?: PaginationProps;
  rowKey: string;
  loading?: boolean;
}

export const DamTable = ({
  columns,
  dataSource,
  pagination,
  rowKey,
  loading,
  ...rest
}: DamTableProps) => {
  const meta = pagination?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.per_page) : 0;
  const currentPage = meta?.current_page ?? 1;

  const handlePageChange = (newPage: number) => {
    if (pagination?.onChange) {
      pagination.onChange(newPage, meta?.per_page ?? 20);
    }
  };

  const handlePerPageChange = (newPerPage: number) => {
    if (pagination?.onChange) {
      pagination.onChange(1, newPerPage);
    }
  };

  const renderTableBody = () => {
    if (loading) {
      return (
        <Tr>
          <Td colSpan={columns.length} textAlign="center">
            Loading...
          </Td>
        </Tr>
      );
    }
    
    if (dataSource.length === 0) {
      return (
        <Tr>
          <Td colSpan={columns.length} textAlign="center">
            No data
          </Td>
        </Tr>
      );
    }

    return dataSource.map((record) => (
      <Tr key={record[rowKey]}>
        {columns.map((column) => (
          <Td key={`${record[rowKey]}-${column.key}`}>
            {column.render
              ? column.render(record[column.dataIndex], record)
              : record[column.dataIndex]}
          </Td>
        ))}
      </Tr>
    ));
  };

  return (
    <Box width='100%'>
      <TableContainer>
        <Table variant="simple" {...rest}>
          <Thead>
            <Tr>
              {columns.map((column) => (
                <Th key={column.key} width={column.width}>
                  {column.title}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {renderTableBody()}
          </Tbody>
        </Table>
      </TableContainer>

      {pagination && meta && (
        <Flex justify="space-between" align="center" mt={4} px={2}>
          <Flex align="center" gap={4} alignItems={'center'}>
            <Text mb={0}>Rows per page:</Text>
            <Select
              value={meta.per_page}
              onChange={(e) => handlePerPageChange(Number(e.target.value))}
              width="100px"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </Select>
          </Flex>

          <Flex align="center" gap={4}>
            <Text mb={0}>
              {meta.per_page * (currentPage - 1) + 1}-
              {Math.min(meta.per_page * currentPage, meta.total)} of {meta.total}
            </Text>
            <Flex gap={2} align="center">
              <IconButton
                aria-label="First page"
                icon={<ArrowLeftIcon />}
                size="sm"
                onClick={() => handlePageChange(1)}
                isDisabled={currentPage === 1}
              />
              <IconButton
                aria-label="Previous page"
                icon={<ChevronLeftIcon />}
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                isDisabled={currentPage === 1}
              />
              <Text minW="80px" textAlign="center" mb={0}>
                {currentPage} / {totalPages}
              </Text>
              <IconButton
                aria-label="Next page"
                icon={<ChevronRightIcon />}
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                isDisabled={currentPage === totalPages}
              />
              <IconButton
                aria-label="Last page"
                icon={<ArrowRightIcon />}
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                isDisabled={currentPage === totalPages}
              />
            </Flex>
          </Flex>
        </Flex>
      )}
    </Box>
  );
}; 